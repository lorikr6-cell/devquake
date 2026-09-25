import type { PluginDatabase } from '@devquake/plugin-sdk';
import { HttpError } from './http';
import type { Metric } from './catalog';
import { MAX_PHOTO_BYTES, sniffPhoto, type PhotoKind } from './photos';
import type { WorkoutStat } from './stats';

/** Progress data of the workout app (ADR 0015): photos, calendar statistics, feedback. */

type Db = Omit<PluginDatabase, 'transaction'>;
const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const dateOnly = (v: unknown) =>
  v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);

// --- Photos -------------------------------------------------------------------------------------

export interface PhotoInfo {
  id: number;
  kind: PhotoKind;
  /** "YYYY-MM-DD" */
  period: string;
  /** Changes when the photo is replaced. */
  version: string;
}

export async function listPhotos(db: Db, userId: number): Promise<PhotoInfo[]> {
  const rows = await db.query<{
    id: number;
    kind: PhotoKind;
    period: Date | string;
    updated_at: Date | string;
  }>(
    `SELECT id, kind, period, updated_at FROM progress_photos WHERE user_id = ?
      ORDER BY period, FIELD(kind, 'start', 'month', 'year'), id`,
    [userId],
  );
  return rows.map((r) => ({
    id: Number(r.id),
    kind: r.kind,
    period: dateOnly(r.period),
    version: new Date(r.updated_at).getTime().toString(36),
  }));
}

/** Saves a photo for a period, replacing the one there (and any older starting photo). */
export async function savePhoto(
  db: PluginDatabase,
  userId: number,
  kind: PhotoKind,
  period: string,
  bytes: Uint8Array,
): Promise<number> {
  if (bytes.length > MAX_PHOTO_BYTES) throw new HttpError(413, 'photoTooLarge');
  const mime = sniffPhoto(bytes);
  if (!mime) throw new HttpError(415, 'photoType');
  return db.transaction(async (tx) => {
    if (kind === 'start') {
      await tx.execute("DELETE FROM progress_photos WHERE user_id = ? AND kind = 'start'", [
        userId,
      ]);
    }
    await tx.execute(
      `INSERT INTO progress_photos (user_id, kind, period, mime, data, bytes) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE mime = VALUES(mime), data = VALUES(data), bytes = VALUES(bytes),
          updated_at = CURRENT_TIMESTAMP`,
      [userId, kind, period, mime, Buffer.from(bytes), bytes.length],
    );
    const [row] = await tx.query<{ id: number }>(
      'SELECT id FROM progress_photos WHERE user_id = ? AND kind = ? AND period = ?',
      [userId, kind, period],
    );
    return Number(row!.id);
  });
}

export async function readPhoto(db: Db, userId: number, photoId: number) {
  const [row] = await db.query<{ mime: string; data: Buffer }>(
    'SELECT mime, data FROM progress_photos WHERE id = ? AND user_id = ?',
    [photoId, userId],
  );
  if (!row) throw new HttpError(404, 'notFound');
  return row;
}

export async function deletePhoto(db: Db, userId: number, photoId: number): Promise<void> {
  const { affectedRows } = await db.execute(
    'DELETE FROM progress_photos WHERE id = ? AND user_id = ?',
    [photoId, userId],
  );
  if (affectedRows === 0) throw new HttpError(404, 'notFound');
}

// --- Calendar -----------------------------------------------------------------------------------

/** Finished workouts started in [from, to) with their totals. */
export async function workoutStats(
  db: Db,
  userId: number,
  from: Date,
  to: Date,
): Promise<WorkoutStat[]> {
  const rows = await db.query<{
    id: number;
    template: string | null;
    routine_name: string | null;
    started_at: Date;
    finished_at: Date;
    kcal: string | null;
    sets_done: number | string;
    sets_planned: number | string;
    reps: number | string;
    volume: number | string;
  }>(
    `SELECT s.id, s.template, s.routine_name, s.started_at, s.finished_at, s.kcal,
        (SELECT COUNT(*) FROM session_sets ss JOIN session_items si ON si.id = ss.session_item_id
          WHERE si.session_id = s.id AND ss.done_at IS NOT NULL) AS sets_done,
        (SELECT COALESCE(SUM(si.sets), 0) FROM session_items si WHERE si.session_id = s.id) AS sets_planned,
        (SELECT COALESCE(SUM(ss.reps), 0) FROM session_sets ss JOIN session_items si ON si.id = ss.session_item_id
          WHERE si.session_id = s.id AND ss.done_at IS NOT NULL) AS reps,
        (SELECT COALESCE(SUM(ss.reps * ss.weight_kg), 0) FROM session_sets ss
           JOIN session_items si ON si.id = ss.session_item_id
          WHERE si.session_id = s.id AND ss.done_at IS NOT NULL) AS volume
      FROM sessions s
      WHERE s.user_id = ? AND s.status = 'finished' AND s.started_at >= ? AND s.started_at < ?
      ORDER BY s.started_at`,
    [userId, from, to],
  );
  return rows.map((r) => ({
    id: Number(r.id),
    template: r.template,
    routineName: r.routine_name,
    startedAt: new Date(r.started_at).toISOString(),
    seconds: Math.max(
      0,
      Math.round((new Date(r.finished_at).getTime() - new Date(r.started_at).getTime()) / 1000),
    ),
    kcal: num(r.kcal),
    setsDone: Number(r.sets_done),
    setsPlanned: Number(r.sets_planned),
    reps: Number(r.reps),
    volumeKg: Number(r.volume),
  }));
}

export interface Improvement {
  sessionId: number;
  slug: string;
  metric: Metric;
  /** What improved: the weight, the repetitions, the hold time or the distance. */
  measure: 'weight' | 'reps' | 'seconds' | 'distance';
  before: number;
  after: number;
  /** Better than every earlier workout, not just the last one. */
  record: boolean;
}

interface BestRow {
  exercise_id: number;
  slug: string | null;
  metric: Metric;
  weighted: number;
  weight: string | null;
  reps: number | null;
  seconds: number | null;
  distance: number | null;
}

/** The best set of each exercise of a workout (or of earlier workouts). */
const BEST = `SELECT si.exercise_id, e.slug, e.metric, e.weighted,
      MAX(ss.weight_kg) AS weight, MAX(ss.reps) AS reps, MAX(ss.seconds) AS seconds,
      MAX(ss.distance_m) AS distance
    FROM session_items si
    JOIN sessions s ON s.id = si.session_id
    JOIN exercises e ON e.id = si.exercise_id
    JOIN session_sets ss ON ss.session_item_id = si.id AND ss.done_at IS NOT NULL`;

function measureOf(r: BestRow): { measure: Improvement['measure']; value: number } | null {
  if (r.metric === 'distance') return { measure: 'distance', value: Number(r.distance ?? 0) };
  if (r.metric === 'time') return { measure: 'seconds', value: Number(r.seconds ?? 0) };
  if (Number(r.weighted) && Number(r.weight ?? 0) > 0)
    return { measure: 'weight', value: Number(r.weight) };
  return { measure: 'reps', value: Number(r.reps ?? 0) };
}

/**
 * What got better in a workout compared with the last time each exercise was done (and
 * whether it is a personal record), for the day's feedback.
 */
export async function improvements(
  db: Db,
  userId: number,
  sessionId: number,
): Promise<Improvement[]> {
  const today = await db.query<BestRow & { started_at: Date }>(
    `${BEST} WHERE s.id = ? AND s.user_id = ? GROUP BY si.exercise_id, e.slug, e.metric, e.weighted`,
    [sessionId, userId],
  );
  const [session] = await db.query<{ started_at: Date }>(
    'SELECT started_at FROM sessions WHERE id = ?',
    [sessionId],
  );
  if (!session) return [];
  const out: Improvement[] = [];
  for (const row of today) {
    const now = measureOf(row);
    if (!now || !row.slug) continue;
    const [last] = await db.query<BestRow>(
      `${BEST} WHERE s.user_id = ? AND s.status = 'finished' AND si.exercise_id = ? AND s.started_at < ?
        GROUP BY s.id, si.exercise_id, e.slug, e.metric, e.weighted ORDER BY MAX(s.started_at) DESC LIMIT 1`,
      [userId, row.exercise_id, session.started_at],
    );
    if (!last) continue;
    const before = measureOf(last)!;
    if (before.measure !== now.measure || now.value <= before.value) continue;
    const [ever] = await db.query<BestRow>(
      `${BEST} WHERE s.user_id = ? AND s.status = 'finished' AND si.exercise_id = ? AND s.started_at < ?
        GROUP BY si.exercise_id, e.slug, e.metric, e.weighted`,
      [userId, row.exercise_id, session.started_at],
    );
    const best = ever ? measureOf(ever)!.value : 0;
    out.push({
      sessionId,
      slug: row.slug,
      metric: row.metric,
      measure: now.measure,
      before: before.value,
      after: now.value,
      record: now.value > best,
    });
  }
  return out;
}

// --- Monthly email ------------------------------------------------------------------------------

/**
 * People due for the email of `month` ("YYYY-MM"): a profile made before the month ended, the
 * email turned on, and no report yet. At most `limit` per run.
 */
export async function dueForMonthlyEmail(
  db: Db,
  month: string,
  monthEnd: Date,
  limit: number,
): Promise<number[]> {
  const rows = await db.query<{ user_id: number }>(
    `SELECT p.user_id FROM profiles p
      WHERE p.monthly_email = 1 AND p.created_at < ?
        AND NOT EXISTS (SELECT 1 FROM monthly_reports r WHERE r.user_id = p.user_id AND r.month = ?)
      ORDER BY p.user_id LIMIT ?`,
    [monthEnd, month, limit],
  );
  return rows.map((r) => Number(r.user_id));
}

/** Claims a person's report for a month; false when another server already did. */
export async function claimMonthlyReport(db: Db, userId: number, month: string): Promise<boolean> {
  const { affectedRows } = await db.execute(
    'INSERT IGNORE INTO monthly_reports (user_id, month) VALUES (?, ?)',
    [userId, month],
  );
  return affectedRows > 0;
}

export async function markMonthlyReport(db: Db, userId: number, month: string, sent: boolean) {
  await db.execute('UPDATE monthly_reports SET sent = ? WHERE user_id = ? AND month = ?', [
    sent ? 1 : 0,
    userId,
    month,
  ]);
}

export async function setMonthlyEmail(db: Db, userId: number, on: boolean) {
  await db.execute('UPDATE profiles SET monthly_email = ? WHERE user_id = ?', [on ? 1 : 0, userId]);
}

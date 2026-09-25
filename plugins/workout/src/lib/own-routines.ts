import type { PluginDatabase } from '@devquake/plugin-sdk';
import { loadCatalogue, type CatalogExercise } from './data';
import { HttpError } from './http';
import type { PlannedItem } from './model';
import { MAX_PLAN_ENTRIES, findOverlap, formatTime, type PlanSlot, type Weekday } from './plan';
import type { RoutineInput } from './routine-input';

/**
 * Own routines and the workout plan (ADR 0018). Own routines are `routines` rows with
 * source = 'custom': only their creator sees them (every query is scoped to the user), they are
 * never replaced by "Create my routines again", and only they can be edited or deleted.
 */

type Db = Omit<PluginDatabase, 'transaction'>;

/** Built-in exercises by slug, for validating the builder's input. */
export async function catalogueBySlug(db: Db): Promise<Map<string, CatalogExercise>> {
  return new Map((await loadCatalogue(db)).map((e) => [e.slug, e]));
}

export const MAX_OWN_ROUTINES = 50;

async function writeItems(
  tx: Db,
  routineId: number,
  items: PlannedItem[],
  bySlug: Map<string, CatalogExercise>,
) {
  await tx.execute('DELETE FROM routine_items WHERE routine_id = ?', [routineId]);
  let position = 0;
  for (const item of items) {
    const e = bySlug.get(item.slug);
    if (!e) continue;
    position += 1;
    await tx.execute(
      `INSERT INTO routine_items (routine_id, position, phase, exercise_id, sets, reps_min, reps_max,
          target_reps, seconds, distance_m, rest_seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        routineId,
        position,
        item.phase,
        e.id,
        item.sets,
        item.repsMin,
        item.repsMax,
        item.targetReps,
        item.seconds,
        item.distanceM,
        item.restSeconds,
      ],
    );
  }
}

export async function createOwnRoutine(
  db: PluginDatabase,
  userId: number,
  input: RoutineInput,
  bySlug: Map<string, CatalogExercise>,
): Promise<number> {
  return db.transaction(async (tx) => {
    const [count] = await tx.query<{ n: number }>(
      "SELECT COUNT(*) AS n FROM routines WHERE user_id = ? AND source = 'custom'",
      [userId],
    );
    if (Number(count?.n ?? 0) >= MAX_OWN_ROUTINES) {
      throw new HttpError(409, 'tooManyRoutines', { max: MAX_OWN_ROUTINES });
    }
    const { insertId } = await tx.execute(
      "INSERT INTO routines (user_id, location, source, name) VALUES (?, ?, 'custom', ?)",
      [userId, input.location, input.name],
    );
    await writeItems(tx, insertId, input.items, bySlug);
    return insertId;
  });
}

/** Only the person's own routines can be changed (404 for anything else). */
async function ownRoutineOrThrow(tx: Db, userId: number, routineId: number) {
  const [row] = await tx.query<{ id: number }>(
    `SELECT id FROM routines
      WHERE id = ? AND user_id = ? AND source = 'custom' AND archived_at IS NULL FOR UPDATE`,
    [routineId, userId],
  );
  if (!row) throw new HttpError(404, 'notFound');
}

/**
 * Saves changes to an own routine. Workouts already done keep their own copy (session_items),
 * so history is not changed.
 */
export async function updateOwnRoutine(
  db: PluginDatabase,
  userId: number,
  routineId: number,
  input: RoutineInput,
  bySlug: Map<string, CatalogExercise>,
): Promise<void> {
  await db.transaction(async (tx) => {
    await ownRoutineOrThrow(tx, userId, routineId);
    await tx.execute('UPDATE routines SET name = ?, location = ? WHERE id = ?', [
      input.name,
      input.location,
      routineId,
    ]);
    await writeItems(tx, routineId, input.items, bySlug);
  });
}

/**
 * Deletes an own routine with its place in the plan (foreign key). Past workouts stay: they keep
 * the routine's name and their own copy of the exercises.
 */
export async function deleteOwnRoutine(
  db: PluginDatabase,
  userId: number,
  routineId: number,
): Promise<void> {
  await db.transaction(async (tx) => {
    await ownRoutineOrThrow(tx, userId, routineId);
    await tx.execute('DELETE FROM routines WHERE id = ?', [routineId]);
  });
}

// --- The plan ------------------------------------------------------------------------------------

export interface PlanEntry extends PlanSlot {
  id: number;
  routineName: string | null;
  template: string | null;
  location: string;
}

interface PlanRow {
  id: number;
  routine_id: number;
  weekday: number | null;
  start_minute: number;
  duration_minutes: number;
  name: string | null;
  template: string | null;
  location: string;
}

const toEntry = (r: PlanRow): PlanEntry => ({
  id: Number(r.id),
  routineId: Number(r.routine_id),
  weekday: r.weekday === null ? null : (Number(r.weekday) as Weekday),
  start: Number(r.start_minute),
  duration: Number(r.duration_minutes),
  routineName: r.name,
  template: r.template,
  location: r.location,
});

/** The person's plan (only routines they can still use), earliest first. */
export async function listPlan(db: Db, userId: number): Promise<PlanEntry[]> {
  const rows = await db.query<PlanRow>(
    `SELECT p.id, p.routine_id, p.weekday, p.start_minute, p.duration_minutes,
            r.name, r.template, r.location
       FROM plan_entries p JOIN routines r ON r.id = p.routine_id AND r.user_id = p.user_id
      WHERE p.user_id = ? AND r.archived_at IS NULL
      ORDER BY p.start_minute, p.weekday`,
    [userId],
  );
  return rows.map(toEntry);
}

/**
 * Adds a slot to the plan, or moves one (`entryId`). Refuses slots that overlap another slot on
 * the same day (409, naming it); the check and the write happen in one transaction with the
 * person's slots locked, so two tabs cannot create an overlap.
 */
export async function savePlanEntry(
  db: PluginDatabase,
  userId: number,
  slot: PlanSlot,
  entryId?: number,
): Promise<number> {
  return db.transaction(async (tx) => {
    const [routine] = await tx.query<{ id: number }>(
      'SELECT id FROM routines WHERE id = ? AND user_id = ? AND archived_at IS NULL',
      [slot.routineId, userId],
    );
    if (!routine) throw new HttpError(404, 'notFound');
    const rows = await tx.query<PlanRow>(
      `SELECT p.id, p.routine_id, p.weekday, p.start_minute, p.duration_minutes,
              r.name, r.template, r.location
         FROM plan_entries p JOIN routines r ON r.id = p.routine_id
        WHERE p.user_id = ? AND r.archived_at IS NULL FOR UPDATE`,
      [userId],
    );
    const entries = rows.map(toEntry);
    if (entryId !== undefined && !entries.some((e) => e.id === entryId)) {
      throw new HttpError(404, 'notFound');
    }
    if (entryId === undefined && entries.length >= MAX_PLAN_ENTRIES) {
      throw new HttpError(409, 'planFull', { max: MAX_PLAN_ENTRIES });
    }
    const clash = findOverlap(entries, slot, entryId) as PlanEntry | null;
    if (clash) {
      throw new HttpError(409, 'planOverlap', {
        // A suggested routine has no name of its own: the API names it by its template.
        routine: clash.routineName ?? '',
        template: clash.template ?? 'custom',
        start: formatTime(clash.start),
        end: formatTime(clash.start + clash.duration),
      });
    }
    if (entryId !== undefined) {
      await tx.execute(
        `UPDATE plan_entries SET routine_id = ?, weekday = ?, start_minute = ?, duration_minutes = ?
          WHERE id = ? AND user_id = ?`,
        [slot.routineId, slot.weekday, slot.start, slot.duration, entryId, userId],
      );
      return entryId;
    }
    const { insertId } = await tx.execute(
      `INSERT INTO plan_entries (user_id, routine_id, weekday, start_minute, duration_minutes)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, slot.routineId, slot.weekday, slot.start, slot.duration],
    );
    return insertId;
  });
}

export async function deletePlanEntry(db: Db, userId: number, entryId: number): Promise<void> {
  await db.execute('DELETE FROM plan_entries WHERE id = ? AND user_id = ?', [entryId, userId]);
}

import type { PluginDatabase } from '@devquake/plugin-sdk';
import { autoProp, motionFor } from '../illustrations/auto';
import { itemKcal } from './calories';
import { weightStep, type HandProp, type Location, type Metric } from './catalog';
import { generateRoutines } from './generator';
import { HttpError } from './http';
import type {
  ExerciseInfo,
  PlannedItem,
  Profile,
  SessionItemView,
  SessionOp,
  SessionView,
  SetResult,
} from './model';
import { nextTarget, type LastTime, type Target } from './progression';

/** Database access of the workout app (ADR 0013). Every query is scoped to the user. */

type Db = Omit<PluginDatabase, 'transaction'>;

const iso = (value: unknown): string | null =>
  value === null || value === undefined ? null : new Date(value as string | Date).toISOString();
const num = (value: unknown): number | null =>
  value === null || value === undefined ? null : Number(value);
const list = (value: unknown): string[] =>
  typeof value === 'string' && value !== '' ? value.split(',') : [];

// --- Catalogue ----------------------------------------------------------------------------------

export interface CatalogExercise extends ExerciseInfo {
  id: number;
  muscles: string[];
  motion: string;
  prop: HandProp | null;
}

export interface EquipmentRow {
  slug: string;
  home: boolean;
  iconSvg: string;
}

interface ExerciseRow {
  id: number;
  slug: string;
  role: ExerciseInfo['role'];
  pattern: string;
  metric: Metric;
  places: string;
  muscles: string;
  difficulty: number;
  low_impact: number;
  weighted: number;
  seconds_per_rep: string;
  speed_mps: string;
  met: string;
  motion: string | null;
  prop: string | null;
  equipment: string | null;
}

function toExercise(r: ExerciseRow): CatalogExercise {
  const equipment = list(r.equipment);
  return {
    id: Number(r.id),
    slug: r.slug,
    role: r.role,
    pattern: r.pattern,
    metric: r.metric,
    equipment,
    places: list(r.places) as Location[],
    difficulty: Number(r.difficulty),
    lowImpact: Boolean(Number(r.low_impact)),
    weighted: Boolean(Number(r.weighted)),
    secondsPerRep: Number(r.seconds_per_rep),
    speed: Number(r.speed_mps),
    met: Number(r.met),
    muscles: list(r.muscles),
    // Exercises without their own animation get one automatically (ADR 0015).
    motion: motionFor({
      pattern: r.pattern,
      role: r.role,
      metric: r.metric,
      equipment,
      motion: r.motion,
    }),
    prop: (r.prop as HandProp | null) ?? autoProp(equipment),
  };
}

const EXERCISE_COLUMNS = `e.id, e.slug, e.role, e.pattern, e.metric, e.places, e.muscles, e.difficulty,
  e.low_impact, e.weighted, e.seconds_per_rep, e.speed_mps, e.met, e.motion, e.prop,
  (SELECT GROUP_CONCAT(ee.equipment_slug ORDER BY ee.equipment_slug)
     FROM exercise_equipment ee WHERE ee.exercise_id = e.id) AS equipment`;

/** The built-in exercises in use, in catalogue order. */
export async function loadCatalogue(db: Db): Promise<CatalogExercise[]> {
  const rows = await db.query<ExerciseRow>(
    `SELECT ${EXERCISE_COLUMNS} FROM exercises e
      WHERE e.user_id IS NULL AND e.retired_at IS NULL ORDER BY e.sort_order, e.id`,
  );
  return rows.map(toExercise);
}

/** Exercises by id (also retired ones: old routines and workouts still point at them). */
async function exercisesById(db: Db, ids: number[]): Promise<Map<number, CatalogExercise>> {
  if (ids.length === 0) return new Map();
  const rows = await db.query<ExerciseRow>(
    `SELECT ${EXERCISE_COLUMNS} FROM exercises e WHERE e.id IN (?)`,
    [[...new Set(ids)]],
  );
  return new Map(rows.map((r) => [Number(r.id), toExercise(r)]));
}

export async function listEquipment(db: Db): Promise<EquipmentRow[]> {
  const rows = await db.query<{ slug: string; home: number; icon_svg: string }>(
    'SELECT slug, home, icon_svg FROM equipment ORDER BY sort_order, slug',
  );
  return rows.map((r) => ({ slug: r.slug, home: Boolean(Number(r.home)), iconSvg: r.icon_svg }));
}

// --- Profile ------------------------------------------------------------------------------------

export interface UserSetup {
  profile: Profile;
  locations: Location[];
  equipment: string[];
  /** The monthly summary email (ADR 0015). */
  monthlyEmail: boolean;
}

export async function getSetup(db: Db, userId: number): Promise<UserSetup | null> {
  const [row] = await db.query<{
    birth_year: number;
    height_cm: string;
    weight_kg: string;
    weight_unit: 'kg' | 'lb';
    height_unit: 'cm' | 'ft';
    experience: Profile['experience'];
    goal: Profile['goal'];
    days_per_week: number;
    session_minutes: number;
    low_impact: number;
    monthly_email?: number;
  }>('SELECT * FROM profiles WHERE user_id = ?', [userId]);
  if (!row) return null;
  const locations = await db.query<{ location: Location }>(
    "SELECT location FROM user_locations WHERE user_id = ? ORDER BY FIELD(location, 'gym', 'home', 'outside')",
    [userId],
  );
  const equipment = await db.query<{ equipment_slug: string }>(
    'SELECT equipment_slug FROM user_equipment WHERE user_id = ? ORDER BY equipment_slug',
    [userId],
  );
  return {
    profile: {
      birthYear: Number(row.birth_year),
      heightCm: Number(row.height_cm),
      weightKg: Number(row.weight_kg),
      weightUnit: row.weight_unit,
      heightUnit: row.height_unit,
      experience: row.experience,
      goal: row.goal,
      daysPerWeek: Number(row.days_per_week),
      sessionMinutes: Number(row.session_minutes),
      lowImpact: Boolean(Number(row.low_impact)),
    },
    locations: locations.map((l) => l.location),
    equipment: equipment.map((e) => e.equipment_slug),
    monthlyEmail: row.monthly_email === undefined ? true : Boolean(Number(row.monthly_email)),
  };
}

/**
 * Saves the profile, places and home equipment, and creates the generated routines of every
 * place that has none yet (or of all places when `regenerate`).
 */
export async function saveSetup(
  db: PluginDatabase,
  userId: number,
  setup: UserSetup,
  regenerate: boolean,
  year: number,
): Promise<void> {
  const catalogue = await loadCatalogue(db);
  await db.transaction(async (tx) => {
    const p = setup.profile;
    await tx.execute(
      `INSERT INTO profiles (user_id, birth_year, height_cm, weight_kg, weight_unit, height_unit,
          experience, goal, days_per_week, session_minutes, low_impact, monthly_email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE birth_year = VALUES(birth_year), height_cm = VALUES(height_cm),
          weight_kg = VALUES(weight_kg), weight_unit = VALUES(weight_unit),
          height_unit = VALUES(height_unit), experience = VALUES(experience), goal = VALUES(goal),
          days_per_week = VALUES(days_per_week), session_minutes = VALUES(session_minutes),
          low_impact = VALUES(low_impact), monthly_email = VALUES(monthly_email)`,
      [
        userId,
        p.birthYear,
        p.heightCm,
        p.weightKg,
        p.weightUnit,
        p.heightUnit,
        p.experience,
        p.goal,
        p.daysPerWeek,
        p.sessionMinutes,
        p.lowImpact ? 1 : 0,
        setup.monthlyEmail ? 1 : 0,
      ],
    );
    await tx.execute('DELETE FROM user_locations WHERE user_id = ?', [userId]);
    for (const location of setup.locations) {
      await tx.execute('INSERT INTO user_locations (user_id, location) VALUES (?, ?)', [
        userId,
        location,
      ]);
    }
    await tx.execute('DELETE FROM user_equipment WHERE user_id = ?', [userId]);
    for (const slug of setup.equipment) {
      await tx.execute('INSERT INTO user_equipment (user_id, equipment_slug) VALUES (?, ?)', [
        userId,
        slug,
      ]);
    }

    const bySlug = new Map(catalogue.map((e) => [e.slug, e]));
    for (const location of setup.locations) {
      const [existing] = await tx.query<{ n: number }>(
        `SELECT COUNT(*) AS n FROM routines
          WHERE user_id = ? AND location = ? AND source = 'generated' AND archived_at IS NULL`,
        [userId, location],
      );
      if (!regenerate && Number(existing?.n ?? 0) > 0) continue;
      await tx.execute(
        `UPDATE routines SET archived_at = UTC_TIMESTAMP()
          WHERE user_id = ? AND location = ? AND source = 'generated' AND archived_at IS NULL`,
        [userId, location],
      );
      const routines = generateRoutines({
        profile: p,
        location,
        equipment: setup.equipment,
        catalogue,
        year,
      });
      for (const routine of routines) {
        const { insertId } = await tx.execute(
          `INSERT INTO routines (user_id, location, source, template) VALUES (?, ?, 'generated', ?)`,
          [userId, location, routine.template],
        );
        await insertItems(tx, insertId, routine.items, bySlug);
      }
    }
    // The plan follows the new suggestions (ADR 0018).
    await remapPlanAfterRegeneration(tx, userId);
  });
}

async function insertItems(
  tx: Db,
  routineId: number,
  items: PlannedItem[],
  bySlug: Map<string, CatalogExercise>,
) {
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

/**
 * After "Create my routines again", slots of replaced suggested routines move to the new routine
 * with the same template at the same place; slots without such a routine are removed.
 */
async function remapPlanAfterRegeneration(tx: Db, userId: number): Promise<void> {
  await tx.execute(
    `UPDATE plan_entries p
       JOIN routines old ON old.id = p.routine_id AND old.archived_at IS NOT NULL
       JOIN routines nw ON nw.user_id = old.user_id AND nw.location = old.location
                       AND nw.template = old.template AND nw.source = 'generated'
                       AND nw.archived_at IS NULL
        SET p.routine_id = nw.id
      WHERE p.user_id = ?`,
    [userId],
  );
  await tx.execute(
    `DELETE p FROM plan_entries p JOIN routines r ON r.id = p.routine_id
      WHERE p.user_id = ? AND r.archived_at IS NOT NULL`,
    [userId],
  );
}

// --- Routines -----------------------------------------------------------------------------------

export interface RoutineView {
  id: number;
  location: Location;
  source: 'generated' | 'custom';
  template: string | null;
  name: string | null;
  items: (PlannedItem & { exercise: CatalogExercise })[];
}

async function loadRoutines(db: Db, userId: number, routineId?: number): Promise<RoutineView[]> {
  const routines = await db.query<{
    id: number;
    location: Location;
    source: 'generated' | 'custom';
    template: string | null;
    name: string | null;
  }>(
    `SELECT id, location, source, template, name FROM routines
      WHERE user_id = ? AND archived_at IS NULL ${routineId ? 'AND id = ?' : ''}
      ORDER BY FIELD(location, 'gym', 'home', 'outside'), source, id`,
    routineId ? [userId, routineId] : [userId],
  );
  if (routines.length === 0) return [];
  const items = await db.query<{
    routine_id: number;
    phase: 'warmup' | 'main';
    exercise_id: number;
    sets: number;
    reps_min: number | null;
    reps_max: number | null;
    target_reps: number | null;
    seconds: number | null;
    distance_m: number | null;
    rest_seconds: number;
  }>(
    `SELECT routine_id, phase, exercise_id, sets, reps_min, reps_max, target_reps, seconds,
        distance_m, rest_seconds
      FROM routine_items WHERE routine_id IN (?) ORDER BY routine_id, position`,
    [routines.map((r) => r.id)],
  );
  const exercises = await exercisesById(
    db,
    items.map((i) => Number(i.exercise_id)),
  );
  return routines.map((r) => ({
    id: Number(r.id),
    location: r.location,
    source: r.source,
    template: r.template,
    name: r.name,
    items: items
      .filter((i) => Number(i.routine_id) === Number(r.id))
      .flatMap((i) => {
        const exercise = exercises.get(Number(i.exercise_id));
        if (!exercise) return [];
        return [
          {
            slug: exercise.slug,
            phase: i.phase,
            sets: Number(i.sets),
            repsMin: num(i.reps_min),
            repsMax: num(i.reps_max),
            targetReps: num(i.target_reps),
            seconds: num(i.seconds),
            distanceM: num(i.distance_m),
            restSeconds: Number(i.rest_seconds),
            exercise,
          },
        ];
      }),
  }));
}

export function listRoutines(db: Db, userId: number): Promise<RoutineView[]> {
  return loadRoutines(db, userId);
}

export async function getRoutine(db: Db, userId: number, routineId: number): Promise<RoutineView> {
  const [routine] = await loadRoutines(db, userId, routineId);
  if (!routine) throw new HttpError(404, 'notFound');
  return routine;
}

// --- Workouts -----------------------------------------------------------------------------------

/** The last finished workout's result for an exercise, for the next suggestion. */
async function lastTime(db: Db, userId: number, exerciseId: number): Promise<LastTime | undefined> {
  const [item] = await db.query<{
    id: number;
    target_reps: number | null;
    target_seconds: number | null;
    target_distance_m: number | null;
    target_weight_kg: string | null;
  }>(
    `SELECT si.id, si.target_reps, si.target_seconds, si.target_distance_m, si.target_weight_kg
      FROM session_items si JOIN sessions s ON s.id = si.session_id
      WHERE s.user_id = ? AND s.status = 'finished' AND si.exercise_id = ?
        AND EXISTS (SELECT 1 FROM session_sets ss WHERE ss.session_item_id = si.id AND ss.done_at IS NOT NULL)
      ORDER BY s.finished_at DESC, si.id DESC LIMIT 1`,
    [userId, exerciseId],
  );
  if (!item) return undefined;
  const sets = await db.query<{
    reps: number | null;
    seconds: number | null;
    distance_m: number | null;
    weight_kg: string | null;
  }>(
    `SELECT reps, seconds, distance_m, weight_kg FROM session_sets
      WHERE session_item_id = ? AND done_at IS NOT NULL ORDER BY set_no`,
    [item.id],
  );
  return {
    target: {
      reps: num(item.target_reps),
      seconds: num(item.target_seconds),
      distanceM: num(item.target_distance_m),
      weightKg: num(item.target_weight_kg),
    },
    sets: sets.map((s) => ({
      reps: num(s.reps),
      seconds: num(s.seconds),
      distanceM: num(s.distance_m),
      weightKg: num(s.weight_kg),
    })),
  };
}

export interface ActiveSession {
  id: number;
  template: string | null;
  routineName: string | null;
  startedAt: string;
}

export async function activeSession(db: Db, userId: number): Promise<ActiveSession | null> {
  const [row] = await db.query<{
    id: number;
    template: string | null;
    routine_name: string | null;
    started_at: Date;
  }>(
    `SELECT id, template, routine_name, started_at FROM sessions
      WHERE user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`,
    [userId],
  );
  return row
    ? {
        id: Number(row.id),
        template: row.template,
        routineName: row.routine_name,
        startedAt: iso(row.started_at)!,
      }
    : null;
}

/** Starts a workout from a routine: copies its exercises with today's targets. */
export async function startSession(
  db: PluginDatabase,
  userId: number,
  routineId: number,
): Promise<number> {
  const routine = await getRoutine(db, userId, routineId);
  const setup = await getSetup(db, userId);
  if (!setup) throw new HttpError(409, 'noProfile');
  const targets: { item: RoutineView['items'][number]; target: Target }[] = [];
  for (const item of routine.items) {
    const e = item.exercise;
    const base = {
      reps: item.targetReps,
      seconds: item.seconds,
      distanceM: item.distanceM,
      weightKg: null,
    };
    const last = await lastTime(db, userId, e.id);
    const plan = {
      metric: e.metric,
      sets: item.sets,
      repsMin: item.repsMin,
      repsMax: item.repsMax,
      weighted: e.weighted,
      weightStep: weightStep(e.equipment),
    };
    targets.push({ item, target: nextTarget(plan, base, last) });
  }

  return db.transaction(async (tx) => {
    const [running] = await tx.query<{ id: number }>(
      "SELECT id FROM sessions WHERE user_id = ? AND status = 'active' LIMIT 1 FOR UPDATE",
      [userId],
    );
    if (running) throw new HttpError(409, 'activeSession');
    const now = new Date();
    const { insertId } = await tx.execute(
      `INSERT INTO sessions (user_id, routine_id, location, template, routine_name, body_weight_kg, started_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        routine.id,
        routine.location,
        routine.template,
        routine.name,
        setup.profile.weightKg,
        now,
      ],
    );
    let position = 0;
    for (const { item, target } of targets) {
      position += 1;
      await tx.execute(
        `INSERT INTO session_items (session_id, position, phase, exercise_id, sets, reps_min, reps_max,
            target_reps, target_seconds, target_distance_m, target_weight_kg, rest_seconds, started_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          insertId,
          position,
          item.phase,
          item.exercise.id,
          item.sets,
          item.repsMin,
          item.repsMax,
          target.reps,
          target.seconds,
          target.distanceM,
          target.weightKg,
          item.restSeconds,
          position === 1 ? now : null,
        ],
      );
    }
    return insertId;
  });
}

interface SessionRow {
  id: number;
  status: 'active' | 'finished';
  location: Location;
  template: string | null;
  routine_name: string | null;
  body_weight_kg: string;
  started_at: Date;
  finished_at: Date | null;
  kcal: string | null;
}

interface ItemRow {
  id: number;
  position: number;
  phase: 'warmup' | 'main';
  exercise_id: number;
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  target_reps: number | null;
  target_seconds: number | null;
  target_distance_m: number | null;
  target_weight_kg: string | null;
  rest_seconds: number;
  started_at: Date | null;
  ended_at: Date | null;
}

interface SetRow {
  session_item_id: number;
  set_no: number;
  reps: number | null;
  seconds: number | null;
  distance_m: number | null;
  weight_kg: string | null;
  done_at: Date | null;
  client_at: number;
}

async function sessionRow(
  db: Db,
  userId: number,
  sessionId: number,
  lock = false,
): Promise<SessionRow> {
  const [row] = await db.query<SessionRow>(
    `SELECT id, status, location, template, routine_name, body_weight_kg, started_at, finished_at, kcal
      FROM sessions WHERE id = ? AND user_id = ?${lock ? ' FOR UPDATE' : ''}`,
    [sessionId, userId],
  );
  if (!row) throw new HttpError(404, 'notFound');
  return row;
}

async function itemRows(db: Db, sessionId: number): Promise<ItemRow[]> {
  return db.query<ItemRow>(
    `SELECT id, position, phase, exercise_id, sets, reps_min, reps_max, target_reps, target_seconds,
        target_distance_m, target_weight_kg, rest_seconds, started_at, ended_at
      FROM session_items WHERE session_id = ? ORDER BY position`,
    [sessionId],
  );
}

async function setRows(db: Db, itemIds: number[]): Promise<SetRow[]> {
  if (itemIds.length === 0) return [];
  return db.query<SetRow>(
    `SELECT session_item_id, set_no, reps, seconds, distance_m, weight_kg, done_at, client_at
      FROM session_sets WHERE session_item_id IN (?) ORDER BY session_item_id, set_no`,
    [itemIds],
  );
}

const toResult = (s: SetRow): SetResult => ({
  setNo: Number(s.set_no),
  reps: num(s.reps),
  seconds: num(s.seconds),
  distanceM: num(s.distance_m),
  weightKg: num(s.weight_kg),
  doneAt: iso(s.done_at),
});

export async function getSession(db: Db, userId: number, sessionId: number): Promise<SessionView> {
  const session = await sessionRow(db, userId, sessionId);
  const [setup, items] = await Promise.all([getSetup(db, userId), itemRows(db, sessionId)]);
  const [exercises, sets] = await Promise.all([
    exercisesById(
      db,
      items.map((i) => Number(i.exercise_id)),
    ),
    setRows(
      db,
      items.map((i) => Number(i.id)),
    ),
  ]);
  const view: SessionItemView[] = items.map((i) => {
    const e = exercises.get(Number(i.exercise_id));
    return {
      id: Number(i.id),
      position: Number(i.position),
      phase: i.phase,
      slug: e?.slug ?? '',
      metric: e?.metric ?? 'reps',
      weighted: e?.weighted ?? false,
      equipment: e ? [...e.equipment] : [],
      sets: Number(i.sets),
      repsMin: num(i.reps_min),
      repsMax: num(i.reps_max),
      targetReps: num(i.target_reps),
      targetSeconds: num(i.target_seconds),
      targetDistanceM: num(i.target_distance_m),
      targetWeightKg: num(i.target_weight_kg),
      restSeconds: Number(i.rest_seconds),
      startedAt: iso(i.started_at),
      endedAt: iso(i.ended_at),
      results: sets.filter((s) => Number(s.session_item_id) === Number(i.id)).map(toResult),
    };
  });
  return {
    id: Number(session.id),
    status: session.status,
    routineName: session.routine_name,
    template: session.template,
    location: session.location,
    startedAt: iso(session.started_at)!,
    finishedAt: iso(session.finished_at),
    kcal: num(session.kcal),
    bodyWeightKg: Number(session.body_weight_kg),
    weightUnit: setup?.profile.weightUnit ?? 'kg',
    heightUnit: setup?.profile.heightUnit ?? 'cm',
    now: new Date().toISOString(),
    items: view,
  };
}

/** The phone's time for a change, kept between `min` and now (ADR 0013). */
export function clampTime(at: number, min: Date | null, now: Date): Date {
  if (!Number.isFinite(at) || at > now.getTime()) return now;
  if (min && at < min.getTime()) return min;
  return new Date(at);
}

/**
 * Applies the workout screen's changes in order (ADR 0013). Every change can arrive twice or
 * late: a set keeps its newest values (client_at), an exercise ends only once, a finished workout
 * stays finished.
 */
export async function applyOps(
  db: PluginDatabase,
  userId: number,
  sessionId: number,
  ops: SessionOp[],
) {
  await db.transaction(async (tx) => {
    const session = await sessionRow(tx, userId, sessionId, true);
    if (session.status !== 'active') return;
    const items = await itemRows(tx, sessionId);
    const byId = new Map(items.map((i) => [Number(i.id), i]));
    const now = new Date();

    for (const op of ops) {
      if (op.type === 'finish') {
        await finish(tx, session, items, clampTime(op.at, new Date(session.started_at), now));
        return;
      }
      const item = byId.get(op.itemId);
      if (!item) throw new HttpError(404, 'notFound');

      if (op.type === 'set') {
        if (op.setNo > Number(item.sets)) throw new HttpError(400, 'invalidRequest');
        const [existing] = await tx.query<{ client_at: number }>(
          'SELECT client_at FROM session_sets WHERE session_item_id = ? AND set_no = ?',
          [item.id, op.setNo],
        );
        if (existing && Number(existing.client_at) > op.at) continue;
        const doneAt = op.done ? clampTime(op.at, item.started_at, now) : null;
        await tx.execute(
          `INSERT INTO session_sets (session_item_id, set_no, reps, seconds, distance_m, weight_kg, done_at, client_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE reps = VALUES(reps), seconds = VALUES(seconds),
              distance_m = VALUES(distance_m), weight_kg = VALUES(weight_kg),
              done_at = COALESCE(done_at, VALUES(done_at)), client_at = VALUES(client_at)`,
          [
            item.id,
            op.setNo,
            op.reps ?? null,
            op.seconds ?? null,
            op.distanceM ?? null,
            op.weightKg ?? null,
            doneAt,
            op.at,
          ],
        );
        continue;
      }

      // next: end this exercise and start the following one (or finish after the last).
      if (item.ended_at) continue;
      const endedAt = clampTime(op.at, item.started_at, now);
      await tx.execute(
        'UPDATE session_items SET started_at = COALESCE(started_at, ?), ended_at = ? WHERE id = ?',
        [endedAt, endedAt, item.id],
      );
      item.started_at ??= endedAt;
      item.ended_at = endedAt;
      const following = items.find(
        (i) => Number(i.position) > Number(item.position) && !i.ended_at,
      );
      if (!following) {
        await finish(tx, session, items, endedAt);
        return;
      }
      if (!following.started_at) {
        await tx.execute('UPDATE session_items SET started_at = ? WHERE id = ?', [
          endedAt,
          following.id,
        ]);
        following.started_at = endedAt;
      }
    }
  });
}

async function finish(tx: Db, session: SessionRow, items: ItemRow[], at: Date) {
  await tx.execute(
    'UPDATE session_items SET ended_at = ? WHERE session_id = ? AND started_at IS NOT NULL AND ended_at IS NULL',
    [at, session.id],
  );
  for (const item of items) if (item.started_at && !item.ended_at) item.ended_at = at;
  const kcal = await sessionKcal(tx, items, Number(session.body_weight_kg));
  await tx.execute(
    "UPDATE sessions SET status = 'finished', finished_at = ?, kcal = ? WHERE id = ?",
    [at, Math.round(kcal * 10) / 10, session.id],
  );
}

async function sessionKcal(db: Db, items: ItemRow[], bodyWeightKg: number): Promise<number> {
  const [exercises, sets] = await Promise.all([
    exercisesById(
      db,
      items.map((i) => Number(i.exercise_id)),
    ),
    setRows(
      db,
      items.map((i) => Number(i.id)),
    ),
  ]);
  let total = 0;
  for (const item of items) {
    const e = exercises.get(Number(item.exercise_id));
    if (!e) continue;
    const done = sets.filter((s) => Number(s.session_item_id) === Number(item.id) && s.done_at);
    const totalSeconds =
      item.started_at && item.ended_at
        ? (new Date(item.ended_at).getTime() - new Date(item.started_at).getTime()) / 1000
        : null;
    total += itemKcal(
      {
        met: e.met,
        metric: e.metric,
        secondsPerRep: e.secondsPerRep,
        sets: done.map((s) => ({ reps: num(s.reps), seconds: num(s.seconds) })),
        totalSeconds,
      },
      bodyWeightKg,
    );
  }
  return total;
}

/** Discards a workout and everything entered in it. */
export async function deleteSession(db: Db, userId: number, sessionId: number): Promise<void> {
  const { affectedRows } = await db.execute('DELETE FROM sessions WHERE id = ? AND user_id = ?', [
    sessionId,
    userId,
  ]);
  if (affectedRows === 0) throw new HttpError(404, 'notFound');
}

export interface SessionSummary {
  id: number;
  template: string | null;
  routineName: string | null;
  startedAt: string;
  seconds: number;
  kcal: number | null;
}

export async function recentSessions(db: Db, userId: number, limit = 5): Promise<SessionSummary[]> {
  const rows = await db.query<{
    id: number;
    template: string | null;
    routine_name: string | null;
    started_at: Date;
    finished_at: Date;
    kcal: string | null;
  }>(
    `SELECT id, template, routine_name, started_at, finished_at, kcal FROM sessions
      WHERE user_id = ? AND status = 'finished' ORDER BY finished_at DESC LIMIT ?`,
    [userId, limit],
  );
  return rows.map((r) => ({
    id: Number(r.id),
    template: r.template,
    routineName: r.routine_name,
    startedAt: iso(r.started_at)!,
    seconds: Math.round(
      (new Date(r.finished_at).getTime() - new Date(r.started_at).getTime()) / 1000,
    ),
    kcal: num(r.kcal),
  }));
}

/** Finished workouts in the last 7 days: count, minutes and kcal. */
export async function weekStats(db: Db, userId: number) {
  const [row] = await db.query<{ workouts: number; seconds: string | null; kcal: string | null }>(
    `SELECT COUNT(*) AS workouts,
        SUM(TIMESTAMPDIFF(SECOND, started_at, finished_at)) AS seconds, SUM(kcal) AS kcal
      FROM sessions
      WHERE user_id = ? AND status = 'finished' AND finished_at >= UTC_TIMESTAMP() - INTERVAL 7 DAY`,
    [userId],
  );
  return {
    workouts: Number(row?.workouts ?? 0),
    minutes: Math.round(Number(row?.seconds ?? 0) / 60),
    kcal: Math.round(Number(row?.kcal ?? 0)),
  };
}

import type { PluginDatabase } from '@devquake/plugin-sdk';
import { loadExercisesFor, type CatalogExercise } from './data';
import { MAX_OWN_EXERCISES, type ExerciseInput } from './exercise-input';
import { HttpError } from './http';

/**
 * Own exercises (ADR 0019): `exercises` rows with the person's user_id, their own name and
 * description, and the slug 'u<id>'. Only their creator sees and uses them. Their animation is
 * chosen automatically from the movement and equipment, like for new built-in exercises.
 */

type Db = Omit<PluginDatabase, 'transaction'>;

export async function listOwnExercises(db: Db, userId: number): Promise<CatalogExercise[]> {
  return (await loadExercisesFor(db, userId)).filter((e) => e.own);
}

export async function getOwnExercise(
  db: Db,
  userId: number,
  exerciseId: number,
): Promise<CatalogExercise> {
  const found = (await listOwnExercises(db, userId)).find((e) => e.id === exerciseId);
  if (!found) throw new HttpError(404, 'notFound');
  return found;
}

async function writeEquipment(tx: Db, exerciseId: number, equipment: string[]) {
  await tx.execute('DELETE FROM exercise_equipment WHERE exercise_id = ?', [exerciseId]);
  for (const slug of equipment) {
    await tx.execute('INSERT INTO exercise_equipment (exercise_id, equipment_slug) VALUES (?, ?)', [
      exerciseId,
      slug,
    ]);
  }
}

const values = (e: ExerciseInput) => [
  e.name,
  e.howTo,
  e.role,
  e.pattern,
  e.metric,
  e.places.join(','),
  e.muscles.join(','),
  e.difficulty,
  e.lowImpact ? 1 : 0,
  e.weighted ? 1 : 0,
  e.secondsPerRep,
  e.speed,
  e.met,
];

export async function createOwnExercise(
  db: PluginDatabase,
  userId: number,
  input: ExerciseInput,
): Promise<number> {
  return db.transaction(async (tx) => {
    const [count] = await tx.query<{ n: number }>(
      'SELECT COUNT(*) AS n FROM exercises WHERE user_id = ? AND retired_at IS NULL',
      [userId],
    );
    if (Number(count?.n ?? 0) >= MAX_OWN_EXERCISES) {
      throw new HttpError(409, 'tooManyExercises', { max: MAX_OWN_EXERCISES });
    }
    const { insertId } = await tx.execute(
      `INSERT INTO exercises (user_id, name, how_to, role, pattern, metric, places, muscles,
          difficulty, low_impact, weighted, seconds_per_rep, speed_mps, met)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, ...values(input)],
    );
    // The slug ties routines and workouts to it, like the built-in exercises' slugs.
    await tx.execute('UPDATE exercises SET slug = ? WHERE id = ?', [`u${insertId}`, insertId]);
    await writeEquipment(tx, insertId, input.equipment);
    return insertId;
  });
}

async function usage(tx: Db, exerciseId: number) {
  const [row] = await tx.query<{ routines: number; history: number }>(
    `SELECT
       (SELECT COUNT(DISTINCT ri.routine_id) FROM routine_items ri
          JOIN routines r ON r.id = ri.routine_id AND r.archived_at IS NULL
         WHERE ri.exercise_id = ?) AS routines,
       (SELECT COUNT(*) FROM routine_items WHERE exercise_id = ?)
         + (SELECT COUNT(*) FROM session_items WHERE exercise_id = ?) AS history`,
    [exerciseId, exerciseId, exerciseId],
  );
  return { routines: Number(row?.routines ?? 0), history: Number(row?.history ?? 0) };
}

async function ownOrThrow(tx: Db, userId: number, exerciseId: number) {
  const [row] = await tx.query<{ metric: string }>(
    `SELECT metric FROM exercises
      WHERE id = ? AND user_id = ? AND retired_at IS NULL FOR UPDATE`,
    [exerciseId, userId],
  );
  if (!row) throw new HttpError(404, 'notFound');
  return row;
}

/**
 * Saves changes. The kind of measurement (repetitions, time, distance) cannot change while a
 * routine or workout uses the exercise, because their targets are in that measurement.
 */
export async function updateOwnExercise(
  db: PluginDatabase,
  userId: number,
  exerciseId: number,
  input: ExerciseInput,
): Promise<void> {
  await db.transaction(async (tx) => {
    const current = await ownOrThrow(tx, userId, exerciseId);
    if (current.metric !== input.metric && (await usage(tx, exerciseId)).history > 0) {
      throw new HttpError(409, 'exerciseMetricInUse');
    }
    await tx.execute(
      `UPDATE exercises SET name = ?, how_to = ?, role = ?, pattern = ?, metric = ?, places = ?,
          muscles = ?, difficulty = ?, low_impact = ?, weighted = ?, seconds_per_rep = ?,
          speed_mps = ?, met = ?
        WHERE id = ?`,
      [...values(input), exerciseId],
    );
    await writeEquipment(tx, exerciseId, input.equipment);
  });
}

/**
 * Deletes an own exercise. While a routine uses it, it cannot be deleted (409, with how many).
 * If past workouts used it, it is only hidden, so the history keeps its name; otherwise it is
 * removed completely. Deleting the account removes all of them (deleteUserData).
 */
export async function deleteOwnExercise(
  db: PluginDatabase,
  userId: number,
  exerciseId: number,
): Promise<void> {
  await db.transaction(async (tx) => {
    await ownOrThrow(tx, userId, exerciseId);
    const used = await usage(tx, exerciseId);
    if (used.routines > 0) {
      throw new HttpError(409, 'exerciseInUse', { count: used.routines });
    }
    if (used.history > 0) {
      await tx.execute('UPDATE exercises SET retired_at = UTC_TIMESTAMP() WHERE id = ?', [
        exerciseId,
      ]);
    } else {
      await tx.execute('DELETE FROM exercises WHERE id = ?', [exerciseId]);
    }
  });
}

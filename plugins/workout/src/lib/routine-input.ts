import { LOCATIONS, type Location } from './catalog';
import { HttpError } from './http';
import type { ExerciseInfo, PlannedItem } from './model';
import {
  MAX_DURATION,
  MIN_DURATION,
  DAY_MINUTES,
  isWeekday,
  parseTime,
  type PlanSlot,
} from './plan';
import { numberIn, type Body } from './validate';

// Input of the routine builder and the plan (ADR 0018). Pure: the API validates with it, and it
// is tested. Errors are HttpError(400) with translation keys, like the rest of the API.

export const ROUTINE_NAME_MAX = 80;
export const MAX_ROUTINE_ITEMS = 30;

export interface RoutineInput {
  name: string;
  location: Location;
  items: PlannedItem[];
}

const bad = (key: string, params?: Record<string, string | number>) =>
  new HttpError(400, key, params);

/**
 * A routine from the builder. Exercises are named by slug and must be built-in exercises for the
 * routine's place. Only the fields of the exercise's metric are kept.
 */
export function routineInput(
  body: Body,
  catalogue: ReadonlyMap<string, Pick<ExerciseInfo, 'slug' | 'metric' | 'places'>>,
): RoutineInput {
  const name = String(body.name ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!name) throw bad('routineName');
  if (name.length > ROUTINE_NAME_MAX) throw bad('routineNameLong', { max: ROUTINE_NAME_MAX });
  const location = body.location;
  if (typeof location !== 'string' || !(LOCATIONS as readonly string[]).includes(location)) {
    throw bad('choice', { field: 'location' });
  }
  const raw = body.items;
  if (!Array.isArray(raw) || raw.length === 0) throw bad('routineEmpty');
  if (raw.length > MAX_ROUTINE_ITEMS) throw bad('routineTooLong', { max: MAX_ROUTINE_ITEMS });

  const items = raw.map((value): PlannedItem => {
    const item = (value ?? {}) as Body;
    const e = catalogue.get(String(item.slug ?? ''));
    if (!e) throw bad('unknownExercise');
    if (!e.places.includes(location as Location)) throw bad('exercisePlace');
    const phase = item.phase === 'warmup' ? 'warmup' : 'main';
    const sets = numberIn(item.sets, 'sets', 1, 10);
    const restSeconds = numberIn(item.restSeconds ?? 60, 'rest', 0, 600);
    const base = {
      slug: e.slug,
      phase,
      sets,
      restSeconds,
      repsMin: null,
      repsMax: null,
      targetReps: null,
      seconds: null,
      distanceM: null,
    } satisfies PlannedItem;
    if (e.metric === 'time') {
      return { ...base, seconds: numberIn(item.seconds, 'seconds', 5, 3600) };
    }
    if (e.metric === 'distance') {
      return { ...base, sets: 1, distanceM: numberIn(item.distanceM, 'distance', 100, 100_000) };
    }
    const repsMin = numberIn(item.repsMin, 'reps', 1, 200);
    const repsMax = numberIn(item.repsMax ?? repsMin, 'reps', repsMin, 200);
    return { ...base, repsMin, repsMax, targetReps: repsMin };
  });
  return { name, location: location as Location, items };
}

/** A plan slot from the plan page: routine, "every day" or a weekday, start time, length. */
export function planInput(body: Body): PlanSlot {
  const routineId = Number(body.routineId);
  if (!Number.isSafeInteger(routineId) || routineId <= 0) throw bad('invalidRequest');
  const weekday = body.weekday === null || body.weekday === 'daily' ? null : Number(body.weekday);
  if (weekday !== null && !isWeekday(weekday)) throw bad('choice', { field: 'weekday' });
  const start = parseTime(body.start);
  if (start === null) throw bad('planTime');
  const duration = numberIn(body.duration, 'duration', MIN_DURATION, MAX_DURATION);
  if (start + duration > DAY_MINUTES) throw bad('planMidnight');
  return { routineId, weekday, start, duration };
}

import {
  EQUIPMENT_SLUGS,
  LOCATIONS,
  MUSCLES,
  type Location,
  type Metric,
  type Pattern,
  type Role,
} from './catalog';
import { HttpError } from './http';
import { numberIn, type Body } from './validate';

// Own exercises (ADR 0019): what a person may describe, and the values the app derives for
// estimates and illustrations. Pure and tested; errors are HttpError(400) with translation keys.

export const EXERCISE_NAME_MAX = 60;
export const EXERCISE_HOWTO_MAX = 600;
export const MAX_OWN_EXERCISES = 100;

export const ROLES: readonly Role[] = ['warmup', 'strength', 'core', 'cardio'];
export const METRICS: readonly Metric[] = ['reps', 'time', 'distance'];

/** The movement choices per kind; the movement picks the animation (src/illustrations/auto.ts). */
export const PATTERNS_BY_ROLE: Record<Role, readonly Pattern[]> = {
  warmup: ['warmup'],
  strength: [
    'squat',
    'lunge',
    'hinge',
    'glute',
    'quads',
    'hamstrings',
    'calves',
    'push_h',
    'chest',
    'push_v',
    'shoulders',
    'pull_h',
    'pull_v',
    'back',
    'biceps',
    'triceps',
  ],
  core: ['core'],
  cardio: ['cardio', 'conditioning'],
};

export interface ExerciseInput {
  name: string;
  howTo: string | null;
  role: Role;
  pattern: Pattern;
  metric: Metric;
  places: Location[];
  equipment: string[];
  muscles: string[];
  difficulty: 1 | 2 | 3;
  weighted: boolean;
  lowImpact: boolean;
  /** Derived for the time and calorie estimates. */
  secondsPerRep: number;
  speed: number;
  met: number;
}

const bad = (key: string, params?: Record<string, string | number>) =>
  new HttpError(400, key, params);

function subset<T extends string>(value: unknown, allowed: readonly T[], field: string): T[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw bad('choice', { field });
  const out = [...new Set(value.map(String))];
  if (out.some((v) => !(allowed as readonly string[]).includes(v))) throw bad('choice', { field });
  return out as T[];
}

/** Effort (MET) for the calorie estimate, by kind of exercise. */
export function metFor(role: Role, metric: Metric, difficulty: number): number {
  if (role === 'warmup') return 3;
  if (role === 'cardio') return metric === 'distance' ? 7 : 8;
  if (role === 'core') return 3.8;
  return [3.5, 5, 6][difficulty - 1] ?? 5;
}

export function exerciseInput(body: Body): ExerciseInput {
  const name = String(body.name ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (name.length < 2) throw bad('exerciseName');
  if (name.length > EXERCISE_NAME_MAX) throw bad('exerciseNameLong', { max: EXERCISE_NAME_MAX });
  const howTo = String(body.howTo ?? '').trim();
  if (howTo.length > EXERCISE_HOWTO_MAX) throw bad('howToLong', { max: EXERCISE_HOWTO_MAX });
  const role = body.role as Role;
  if (!ROLES.includes(role)) throw bad('choice', { field: 'kind' });
  const metric = body.metric as Metric;
  if (!METRICS.includes(metric)) throw bad('choice', { field: 'metric' });
  const patterns = PATTERNS_BY_ROLE[role];
  const pattern = (patterns.length === 1 ? patterns[0] : body.pattern) as Pattern;
  if (!patterns.includes(pattern)) throw bad('choice', { field: 'movement' });
  const places = subset(body.places, LOCATIONS, 'location');
  if (places.length === 0) throw bad('noPlaces');
  const difficulty = numberIn(body.difficulty, 'difficulty', 1, 3) as 1 | 2 | 3;
  const lowImpact = body.lowImpact === true;
  return {
    name,
    howTo: howTo || null,
    role,
    pattern,
    metric,
    places,
    equipment: subset(body.equipment, EQUIPMENT_SLUGS, 'equipment'),
    muscles: subset(body.muscles, MUSCLES, 'muscles'),
    difficulty,
    weighted: body.weighted === true && metric === 'reps',
    lowImpact,
    secondsPerRep: 3,
    speed: metric === 'distance' ? (role === 'cardio' && !lowImpact ? 2.5 : 1.4) : 0,
    met: metFor(role, metric, difficulty),
  };
}

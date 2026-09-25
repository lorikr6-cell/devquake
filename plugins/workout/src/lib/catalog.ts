import { autoProp, motionFor } from '../illustrations/auto';

/**
 * The built-in catalogue (ADR 0013): training places, equipment and exercises. This file is the
 * source of the seed migration (src/lib/seed-sql.ts writes db/migrations/0003_workout_seed.sql);
 * at runtime the app reads the rows from its database. Names and how-to texts are in
 * src/i18n/exercises.ts (exercises.<slug>), illustrations in src/illustrations/.
 */

export const LOCATIONS = ['gym', 'home', 'outside'] as const;
export type Location = (typeof LOCATIONS)[number];

export const MUSCLES = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'core',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
  'full_body',
] as const;
export type Muscle = (typeof MUSCLES)[number];

/** `home`: offered in the "what do you have at home" list (the gym has everything). */
export const EQUIPMENT = [
  { slug: 'dumbbells', home: true },
  { slug: 'kettlebell', home: true },
  { slug: 'barbell', home: true },
  { slug: 'squat_rack', home: true },
  { slug: 'bench', home: true },
  { slug: 'pull_up_bar', home: true },
  { slug: 'resistance_bands', home: true },
  { slug: 'jump_rope', home: true },
  { slug: 'box', home: true },
  { slug: 'treadmill', home: true },
  { slug: 'exercise_bike', home: true },
  { slug: 'rowing_machine', home: true },
  { slug: 'cable_machine', home: false },
  { slug: 'leg_press', home: false },
  { slug: 'leg_machines', home: false },
  { slug: 'chest_press_machine', home: false },
] as const;
export type EquipmentSlug = (typeof EQUIPMENT)[number]['slug'];
export const EQUIPMENT_SLUGS: readonly EquipmentSlug[] = EQUIPMENT.map((e) => e.slug);

export type Metric = 'reps' | 'time' | 'distance';
export type Role = 'warmup' | 'strength' | 'core' | 'cardio';
export type Pattern =
  | 'warmup'
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'glute'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'push_h'
  | 'push_v'
  | 'chest'
  | 'pull_h'
  | 'pull_v'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'conditioning'
  | 'cardio';

/** What the figure holds in its hands. */
export type HandProp = 'dumbbell' | 'kettlebell' | 'barbell';

export interface ExerciseDef {
  slug: string;
  role: Role;
  pattern: Pattern;
  metric: Metric;
  equipment: EquipmentSlug[];
  places: Location[];
  /** 1 easy … 3 hard. */
  difficulty: 1 | 2 | 3;
  /** No jumping or running: suitable for sore joints or a high body weight. */
  lowImpact: boolean;
  /** Done with added weight (the workout asks for it). */
  weighted: boolean;
  /** Seconds one repetition takes, to estimate a routine's length. */
  secondsPerRep: number;
  /** Metres per second, for distance exercises. */
  speed: number;
  /** Metabolic equivalent, for calorie estimates (Compendium of Physical Activities). */
  met: number;
  muscles: Muscle[];
  /**
   * Animation in src/illustrations/motions.ts. Exercises without one of their own get the
   * animation of their pattern and equipment (src/illustrations/auto.ts).
   */
  motion: string;
  prop: HandProp | null;
}

type Options = Partial<Omit<ExerciseDef, 'slug' | 'role' | 'pattern' | 'motion'>>;

/**
 * Defaults: repetitions, no equipment, gym + home, easy, low impact. `motion` null (and no
 * `prop`): the illustration is chosen automatically from the pattern and the equipment.
 */
function ex(slug: string, role: Role, pattern: Pattern, motion: string | null, o: Options = {}) {
  const equipment = o.equipment ?? [];
  const gymOnly = equipment.some((e) => !EQUIPMENT.find((q) => q.slug === e)?.home);
  const def: ExerciseDef = {
    slug,
    role,
    pattern,
    metric: o.metric ?? 'reps',
    equipment,
    places: o.places ?? (gymOnly ? ['gym'] : ['gym', 'home']),
    difficulty: o.difficulty ?? 1,
    lowImpact: o.lowImpact ?? true,
    weighted: o.weighted ?? false,
    secondsPerRep: o.secondsPerRep ?? 3,
    speed: o.speed ?? 0,
    met: o.met ?? 3.8,
    muscles: o.muscles ?? [],
    motion: '',
    prop: o.prop === undefined ? autoProp(equipment) : o.prop,
  };
  def.motion = motionFor({ ...def, motion });
  return def;
}

const ALL: Location[] = ['gym', 'home', 'outside'];
const warm = (slug: string, motion: string | null, o: Options = {}) =>
  ex(slug, 'warmup', 'warmup', motion, { metric: 'time', places: ALL, met: 3, ...o });
const dumbbell = {
  equipment: ['dumbbells'] as EquipmentSlug[],
  weighted: true,
  met: 5,
  prop: 'dumbbell' as const,
};
const barbell = { weighted: true, met: 5 };

export const EXERCISES: ExerciseDef[] = [
  // Warm-ups (timed)
  warm('march_in_place', null, { met: 3.5, muscles: ['full_body'] }),
  warm('jumping_jacks', 'jumping_jack', { lowImpact: false, met: 7.7, muscles: ['full_body'] }),
  warm('high_knees', 'high_knees', {
    lowImpact: false,
    difficulty: 2,
    met: 8,
    muscles: ['quads', 'core'],
  }),
  warm('arm_circles', 'arm_circles', { muscles: ['shoulders'] }),
  warm('hip_circles', 'hip_circles', { muscles: ['core', 'glutes'] }),
  warm('torso_twists', 'torso_twist', { muscles: ['core'] }),
  warm('leg_swings', 'leg_swing', { muscles: ['hamstrings', 'glutes'] }),
  warm('easy_walk', 'walk', { places: ['outside'], speed: 1.2, muscles: ['full_body'] }),

  // Body weight
  ex('push_up', 'strength', 'push_h', null, {
    difficulty: 2,
    places: ALL,
    muscles: ['chest', 'triceps', 'shoulders'],
  }),
  ex('knee_push_up', 'strength', 'push_h', 'knee_push_up', {
    places: ALL,
    muscles: ['chest', 'triceps'],
  }),
  ex('wall_push_up', 'strength', 'push_h', 'wall_push_up', {
    secondsPerRep: 2,
    muscles: ['chest', 'triceps'],
  }),
  ex('diamond_push_up', 'strength', 'triceps', 'push_up', {
    difficulty: 2,
    muscles: ['triceps', 'chest'],
  }),
  ex('incline_push_up', 'strength', 'push_h', 'incline_push_up', {
    equipment: ['bench'],
    muscles: ['chest', 'triceps'],
  }),
  ex('pike_push_up', 'strength', 'push_v', 'pike_push_up', {
    difficulty: 3,
    muscles: ['shoulders', 'triceps'],
  }),
  ex('air_squat', 'strength', 'squat', null, { places: ALL, muscles: ['quads', 'glutes'] }),
  ex('jump_squat', 'strength', 'squat', 'jump_squat', {
    difficulty: 2,
    lowImpact: false,
    places: ALL,
    met: 8,
    muscles: ['quads', 'glutes', 'calves'],
  }),
  ex('reverse_lunge', 'strength', 'lunge', null, {
    places: ALL,
    secondsPerRep: 4,
    muscles: ['quads', 'glutes'],
  }),
  ex('glute_bridge', 'strength', 'glute', null, { muscles: ['glutes', 'hamstrings'] }),
  ex('wall_sit', 'strength', 'quads', 'wall_sit', { metric: 'time', muscles: ['quads'] }),
  ex('calf_raise', 'strength', 'calves', null, {
    places: ALL,
    secondsPerRep: 2,
    muscles: ['calves'],
  }),
  ex('step_up', 'strength', 'lunge', null, {
    equipment: ['box'],
    secondsPerRep: 4,
    muscles: ['quads', 'glutes'],
  }),
  ex('burpee', 'strength', 'conditioning', null, {
    difficulty: 3,
    lowImpact: false,
    places: ALL,
    secondsPerRep: 4,
    met: 8,
    muscles: ['full_body'],
  }),
  ex('mountain_climber', 'strength', 'conditioning', 'mountain_climber', {
    metric: 'time',
    difficulty: 2,
    lowImpact: false,
    places: ALL,
    met: 8,
    muscles: ['core', 'shoulders', 'quads'],
  }),
  ex('superman', 'strength', 'back', null, { muscles: ['back', 'glutes'] }),
  ex('prone_y_raise', 'strength', 'shoulders', 'superman', { muscles: ['shoulders', 'back'] }),
  ex('reverse_snow_angel', 'strength', 'back', 'snow_angel', { muscles: ['back', 'shoulders'] }),
  ex('bench_dip', 'strength', 'triceps', 'bench_dip', {
    equipment: ['bench'],
    difficulty: 2,
    muscles: ['triceps', 'chest'],
  }),

  // Core
  ex('plank', 'core', 'core', null, { metric: 'time', places: ALL, muscles: ['core'] }),
  ex('side_plank', 'core', 'core', 'side_plank', {
    metric: 'time',
    difficulty: 2,
    places: ALL,
    muscles: ['core'],
  }),
  ex('crunch', 'core', 'core', null, { secondsPerRep: 2, muscles: ['core'] }),
  ex('bicycle_crunch', 'core', 'core', 'bicycle_crunch', {
    difficulty: 2,
    secondsPerRep: 2,
    muscles: ['core'],
  }),
  ex('leg_raise', 'core', 'core', 'leg_raise', { difficulty: 2, muscles: ['core'] }),
  ex('dead_bug', 'core', 'core', 'dead_bug', { muscles: ['core'] }),
  ex('russian_twist', 'core', 'core', 'russian_twist', {
    difficulty: 2,
    secondsPerRep: 2,
    muscles: ['core'],
  }),
  ex('hanging_knee_raise', 'core', 'core', 'hanging_knee_raise', {
    equipment: ['pull_up_bar'],
    difficulty: 3,
    muscles: ['core'],
  }),

  // Pull-up bar
  ex('pull_up', 'strength', 'pull_v', null, {
    equipment: ['pull_up_bar'],
    difficulty: 3,
    secondsPerRep: 4,
    met: 8,
    muscles: ['back', 'biceps'],
  }),
  ex('chin_up', 'strength', 'pull_v', null, {
    equipment: ['pull_up_bar'],
    difficulty: 3,
    secondsPerRep: 4,
    met: 8,
    muscles: ['back', 'biceps'],
  }),

  // Dumbbells
  ex('db_bench_press', 'strength', 'push_h', null, {
    ...dumbbell,
    equipment: ['dumbbells', 'bench'],
    difficulty: 2,
    muscles: ['chest', 'triceps', 'shoulders'],
  }),
  ex('db_floor_press', 'strength', 'push_h', 'floor_press', {
    ...dumbbell,
    muscles: ['chest', 'triceps'],
  }),
  ex('db_fly', 'strength', 'chest', null, {
    ...dumbbell,
    equipment: ['dumbbells', 'bench'],
    difficulty: 2,
    met: 3.5,
    muscles: ['chest'],
  }),
  ex('db_shoulder_press', 'strength', 'push_v', null, {
    ...dumbbell,
    difficulty: 2,
    muscles: ['shoulders', 'triceps'],
  }),
  ex('db_lateral_raise', 'strength', 'shoulders', null, {
    ...dumbbell,
    met: 3.5,
    muscles: ['shoulders'],
  }),
  ex('db_row', 'strength', 'pull_h', null, { ...dumbbell, muscles: ['back', 'biceps'] }),
  ex('db_curl', 'strength', 'biceps', null, { ...dumbbell, met: 3.5, muscles: ['biceps'] }),
  ex('db_hammer_curl', 'strength', 'biceps', null, {
    ...dumbbell,
    met: 3.5,
    muscles: ['biceps'],
  }),
  ex('db_overhead_triceps', 'strength', 'triceps', null, {
    ...dumbbell,
    met: 3.5,
    muscles: ['triceps'],
  }),
  ex('db_goblet_squat', 'strength', 'squat', null, {
    ...dumbbell,
    muscles: ['quads', 'glutes'],
  }),
  ex('db_lunge', 'strength', 'lunge', null, {
    ...dumbbell,
    difficulty: 2,
    secondsPerRep: 4,
    muscles: ['quads', 'glutes'],
  }),
  ex('db_romanian_deadlift', 'strength', 'hinge', null, {
    ...dumbbell,
    difficulty: 2,
    muscles: ['hamstrings', 'glutes', 'back'],
  }),

  // Kettlebell
  ex('kb_swing', 'strength', 'hinge', 'kb_swing', {
    equipment: ['kettlebell'],
    weighted: true,

    difficulty: 2,
    lowImpact: false,
    secondsPerRep: 2,
    met: 8,
    muscles: ['glutes', 'hamstrings', 'core'],
  }),
  ex('kb_goblet_squat', 'strength', 'squat', null, {
    equipment: ['kettlebell'],
    weighted: true,

    met: 5,
    muscles: ['quads', 'glutes'],
  }),
  ex('kb_deadlift', 'strength', 'hinge', null, {
    equipment: ['kettlebell'],
    weighted: true,

    met: 5,
    muscles: ['hamstrings', 'glutes', 'back'],
  }),

  // Barbell
  ex('bb_back_squat', 'strength', 'squat', null, {
    ...barbell,
    equipment: ['barbell', 'squat_rack'],
    difficulty: 3,
    secondsPerRep: 4,
    met: 6,
    muscles: ['quads', 'glutes', 'core'],
  }),
  ex('bb_bench_press', 'strength', 'push_h', null, {
    ...barbell,
    equipment: ['barbell', 'bench', 'squat_rack'],
    difficulty: 3,
    muscles: ['chest', 'triceps', 'shoulders'],
  }),
  ex('bb_deadlift', 'strength', 'hinge', null, {
    ...barbell,
    equipment: ['barbell'],
    difficulty: 3,
    secondsPerRep: 4,
    met: 6,
    muscles: ['hamstrings', 'glutes', 'back'],
  }),
  ex('bb_overhead_press', 'strength', 'push_v', null, {
    ...barbell,
    equipment: ['barbell'],
    difficulty: 3,
    muscles: ['shoulders', 'triceps'],
  }),
  ex('bb_row', 'strength', 'pull_h', null, {
    ...barbell,
    equipment: ['barbell'],
    difficulty: 2,
    muscles: ['back', 'biceps'],
  }),
  ex('bb_curl', 'strength', 'biceps', null, {
    ...barbell,
    equipment: ['barbell'],
    difficulty: 2,
    met: 3.5,
    muscles: ['biceps'],
  }),
  ex('bb_hip_thrust', 'strength', 'glute', null, {
    ...barbell,
    equipment: ['barbell', 'bench'],
    difficulty: 2,
    muscles: ['glutes', 'hamstrings'],
  }),
  ex('bb_romanian_deadlift', 'strength', 'hinge', null, {
    ...barbell,
    equipment: ['barbell'],
    difficulty: 2,
    muscles: ['hamstrings', 'glutes', 'back'],
  }),

  // Resistance bands
  ex('band_row', 'strength', 'pull_h', null, {
    equipment: ['resistance_bands'],
    met: 3.5,
    muscles: ['back', 'biceps'],
  }),
  ex('band_pull_apart', 'strength', 'shoulders', 'pull_apart', {
    equipment: ['resistance_bands'],
    secondsPerRep: 2,
    met: 3.5,
    muscles: ['shoulders', 'back'],
  }),
  ex('band_curl', 'strength', 'biceps', null, {
    equipment: ['resistance_bands'],
    met: 3.5,
    muscles: ['biceps'],
  }),
  ex('band_chest_press', 'strength', 'push_h', null, {
    equipment: ['resistance_bands'],
    met: 3.5,
    muscles: ['chest', 'triceps'],
  }),

  // Gym machines
  ex('lat_pulldown', 'strength', 'pull_v', null, {
    equipment: ['cable_machine'],
    weighted: true,
    met: 5,
    muscles: ['back', 'biceps'],
  }),
  ex('seated_cable_row', 'strength', 'pull_h', null, {
    equipment: ['cable_machine'],
    weighted: true,
    met: 5,
    muscles: ['back', 'biceps'],
  }),
  ex('triceps_pushdown', 'strength', 'triceps', null, {
    equipment: ['cable_machine'],
    weighted: true,
    met: 3.5,
    muscles: ['triceps'],
  }),
  ex('face_pull', 'strength', 'shoulders', 'face_pull', {
    equipment: ['cable_machine'],
    weighted: true,
    difficulty: 2,
    met: 3.5,
    muscles: ['shoulders', 'back'],
  }),
  ex('leg_press', 'strength', 'squat', null, {
    equipment: ['leg_press'],
    weighted: true,
    met: 5,
    muscles: ['quads', 'glutes'],
  }),
  ex('leg_curl', 'strength', 'hamstrings', null, {
    equipment: ['leg_machines'],
    weighted: true,
    met: 3.5,
    muscles: ['hamstrings'],
  }),
  ex('leg_extension', 'strength', 'quads', null, {
    equipment: ['leg_machines'],
    weighted: true,
    met: 3.5,
    muscles: ['quads'],
  }),
  ex('machine_chest_press', 'strength', 'push_h', null, {
    equipment: ['chest_press_machine'],
    weighted: true,
    met: 5,
    muscles: ['chest', 'triceps'],
  }),

  // Cardio machines (timed)
  ex('treadmill_run', 'cardio', 'cardio', null, {
    metric: 'time',
    equipment: ['treadmill'],
    difficulty: 2,
    lowImpact: false,
    met: 9,
    muscles: ['full_body'],
  }),
  ex('treadmill_walk', 'cardio', 'cardio', 'walk', {
    metric: 'time',
    equipment: ['treadmill'],
    met: 5,
    muscles: ['full_body'],
  }),
  ex('exercise_bike', 'cardio', 'cardio', null, {
    metric: 'time',
    equipment: ['exercise_bike'],
    met: 6.8,
    muscles: ['quads', 'full_body'],
  }),
  ex('rowing_machine', 'cardio', 'cardio', null, {
    metric: 'time',
    equipment: ['rowing_machine'],
    difficulty: 2,
    met: 7,
    muscles: ['back', 'full_body'],
  }),
  ex('jump_rope', 'cardio', 'cardio', null, {
    metric: 'time',
    equipment: ['jump_rope'],
    difficulty: 2,
    lowImpact: false,
    met: 10,
    muscles: ['calves', 'full_body'],
  }),

  // Outside
  ex('brisk_walk', 'cardio', 'cardio', 'walk', {
    metric: 'distance',
    places: ['outside'],
    speed: 1.6,
    met: 4.3,
    muscles: ['full_body'],
  }),
  ex('jog', 'cardio', 'cardio', 'jog', {
    metric: 'distance',
    places: ['outside'],
    difficulty: 2,
    lowImpact: false,
    speed: 2.4,
    met: 7,
    muscles: ['full_body'],
  }),
  ex('run', 'cardio', 'cardio', null, {
    metric: 'distance',
    places: ['outside'],
    difficulty: 3,
    lowImpact: false,
    speed: 3,
    met: 9.8,
    muscles: ['full_body'],
  }),
  ex('run_walk_intervals', 'cardio', 'cardio', 'jog', {
    metric: 'time',
    places: ['outside'],
    lowImpact: false,
    met: 6,
    muscles: ['full_body'],
  }),
  ex('power_walk_intervals', 'cardio', 'cardio', null, {
    metric: 'time',
    places: ['outside'],
    met: 5,
    muscles: ['full_body'],
  }),
];

const BY_SLUG = new Map(EXERCISES.map((e) => [e.slug, e]));

/** The built-in exercise with this slug, or undefined. */
export function exerciseDef(slug: string): ExerciseDef | undefined {
  return BY_SLUG.get(slug);
}

/** Kilograms added when a weighted exercise moves up (ADR 0013, progression). */
export function weightStep(equipment: readonly string[]): number {
  if (equipment.includes('dumbbells') || equipment.includes('kettlebell')) return 1;
  if (equipment.includes('resistance_bands')) return 0;
  return 2.5;
}

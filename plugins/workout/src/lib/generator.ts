import type { Location } from './catalog';
import type { ExerciseInfo, Experience, Goal, PlannedItem, PlannedRoutine, Profile } from './model';

/**
 * Builds the routines for one training place from the person's profile (ADR 0013). A pure,
 * deterministic function: the same input always gives the same routines, so it is tested on
 * its own and can run again after the profile or the equipment changes.
 */

type Slot = readonly string[];

/** Gym and home: each slot lists the movement patterns it accepts, the preferred first. */
const STRENGTH_TEMPLATES: Record<string, readonly Slot[]> = {
  full_body: [
    ['squat'],
    ['push_h'],
    ['pull_h', 'pull_v', 'back'],
    ['hinge', 'glute'],
    ['push_v', 'shoulders'],
    ['core'],
  ],
  upper_body: [
    ['push_h'],
    ['pull_v', 'pull_h', 'back'],
    ['push_v', 'shoulders'],
    ['pull_h', 'pull_v', 'back'],
    ['biceps'],
    ['triceps'],
    ['chest', 'shoulders'],
  ],
  lower_core: [
    ['squat'],
    ['hinge', 'hamstrings', 'glute'],
    ['lunge'],
    ['glute', 'quads', 'calves'],
    ['calves'],
    ['core'],
    ['core'],
  ],
};

/** Template keys of the gym and home routines (their names are templates.<key>). */
export const STRENGTH_TEMPLATE_KEYS = Object.keys(STRENGTH_TEMPLATES);

const STRENGTH_WARMUPS: Record<string, readonly string[]> = {
  full_body: ['jumping_jacks', 'arm_circles', 'leg_swings'],
  upper_body: ['jumping_jacks', 'arm_circles', 'torso_twists'],
  lower_core: ['high_knees', 'hip_circles', 'leg_swings'],
};

/** Used when a routine ended up with fewer than MIN_MAIN exercises (little equipment). */
const FILL_SLOTS: readonly Slot[] = [
  ['core'],
  ['conditioning', 'squat', 'lunge'],
  ['glute', 'back'],
  ['core'],
];
const MIN_MAIN = 4;

const PARK_SLOTS: readonly Slot[] = [['squat'], ['push_h'], ['lunge'], ['core'], ['conditioning']];

/** Repetition range and rest (seconds) by goal, with and without added weight. */
const REPS: Record<
  Goal,
  { weighted: [number, number, number]; bodyweight: [number, number, number] }
> = {
  strength: { weighted: [5, 6, 150], bodyweight: [6, 10, 90] },
  muscle: { weighted: [8, 12, 90], bodyweight: [8, 15, 75] },
  endurance: { weighted: [15, 20, 45], bodyweight: [15, 25, 45] },
  general: { weighted: [10, 12, 75], bodyweight: [10, 15, 60] },
  weight_loss: { weighted: [12, 15, 45], bodyweight: [12, 20, 45] },
};

const TARGET_DIFFICULTY: Record<Experience, number> = { beginner: 1, intermediate: 2, advanced: 3 };
const MAX_DIFFICULTY: Record<Experience, number> = { beginner: 2, intermediate: 3, advanced: 3 };
const HOLD_SECONDS: Record<Experience, number> = { beginner: 20, intermediate: 40, advanced: 60 };
const WALK_M: Record<Experience, number> = { beginner: 2000, intermediate: 3500, advanced: 5000 };
const JOG_M: Record<Experience, number> = { beginner: 1000, intermediate: 1500, advanced: 2500 };
const INTERVAL_S: Record<Experience, number> = {
  beginner: 900,
  intermediate: 1200,
  advanced: 1800,
};

const WARMUP_SECONDS = 45;
const WARMUP_REST = 10;
const FINISHER_SECONDS = 600;
/** Moving from one exercise to the next. */
const TRANSITION_SECONDS = 20;
const OLDER_AGE = 60;

/** The youngest age a profile can have (ADR 0019). */
export const MIN_AGE = 6;

/**
 * Age groups change the suggestions (ADR 0019): children (6–9) and preteens (10–12) only get
 * body-weight exercises, easier ones and fewer sets; people from 60 get longer rests.
 */
export type AgeGroup = 'child' | 'preteen' | 'adult' | 'older';

export function ageGroup(birthYear: number, year: number): AgeGroup {
  const age = year - birthYear;
  if (age < 10) return 'child';
  if (age < 13) return 'preteen';
  return age >= OLDER_AGE ? 'older' : 'adult';
}

const isYoung = (age: AgeGroup) => age === 'child' || age === 'preteen';

export interface GeneratorInput {
  profile: Profile;
  location: Location;
  /** Equipment owned at home (ignored for the gym, which has everything, and outside). */
  equipment: readonly string[];
  catalogue: readonly ExerciseInfo[];
  /** The current year, for the age. */
  year: number;
}

interface Rules {
  profile: Profile;
  age: AgeGroup;
  maxDifficulty: number;
  targetDifficulty: number;
  available: ExerciseInfo[];
  bySlug: Map<string, ExerciseInfo>;
}

function rulesFor(input: GeneratorInput): Rules {
  const { profile, location, catalogue } = input;
  const age = ageGroup(profile.birthYear, input.year);
  const maxDifficulty =
    age === 'child'
      ? 1
      : age === 'preteen' || age === 'older'
        ? 2
        : MAX_DIFFICULTY[profile.experience];
  const owned = new Set(input.equipment);
  const available = catalogue.filter((e) => {
    if (!e.places.includes(location)) return false;
    if (location === 'home' && !e.equipment.every((q) => owned.has(q))) return false;
    if (location === 'outside' && e.equipment.length > 0) return false;
    if (profile.lowImpact && !e.lowImpact) return false;
    // Children train with their own body weight only.
    if (isYoung(age) && e.weighted) return false;
    return e.difficulty <= maxDifficulty;
  });
  return {
    profile,
    age,
    maxDifficulty,
    targetDifficulty: Math.min(TARGET_DIFFICULTY[profile.experience], maxDifficulty),
    available,
    bySlug: new Map(available.map((e) => [e.slug, e])),
  };
}

function setCount(profile: Profile, age: AgeGroup): number {
  const base = profile.goal === 'strength' ? 4 : 3;
  const adjust = { beginner: -1, intermediate: 0, advanced: 1 }[profile.experience];
  const most = age === 'child' ? 2 : age === 'preteen' ? 3 : 5;
  return Math.max(2, Math.min(most, base + adjust));
}

/** Extra load of a movement pattern on top of the exercise's difficulty (ADR 0015). */
const PATTERN_LOAD: Record<string, number> = {
  pull_v: 1,
  conditioning: 0.5,
  hinge: 0.5,
  push_v: 0.5,
  calves: -1,
  core: -0.5,
  shoulders: -0.5,
  biceps: -0.5,
};

/** How demanding one repetition is: difficulty 1–3 plus the pattern's load. */
export function complexity(e: Pick<ExerciseInfo, 'difficulty' | 'pattern'>): number {
  return e.difficulty + (PATTERN_LOAD[e.pattern] ?? 0);
}

/**
 * How the goal's repetition range (or hold time) is scaled for an exercise: complexity 0 gives
 * ×1.4 (calf raises), 2 gives ×1, 4 gives ×0.6 (pull-ups). With added weight the scale is
 * halved, because the weight itself is adjusted to the person.
 */
export function repScale(e: Pick<ExerciseInfo, 'difficulty' | 'pattern' | 'weighted'>): number {
  const scale = Math.min(1.5, Math.max(0.5, 1.4 - 0.2 * complexity(e)));
  return e.weighted ? 1 + (scale - 1) / 2 : scale;
}

/** Sets, repetitions or time, and rest for one main exercise. */
export function prescribe(e: ExerciseInfo, profile: Profile, age: AgeGroup): PlannedItem {
  const extraRest = age === 'older' ? 30 : 0;
  const sets = setCount(profile, age);
  // Shorter holds for children.
  const holdScale = age === 'child' ? 0.6 : age === 'preteen' ? 0.8 : 1;
  const base = {
    slug: e.slug,
    phase: 'main' as const,
    repsMin: null,
    repsMax: null,
    targetReps: null,
    seconds: null,
    distanceM: null,
  };
  if (e.metric === 'time') {
    const endurance = profile.goal === 'endurance' ? 10 : 0;
    return {
      ...base,
      sets,
      seconds: Math.max(
        10,
        Math.round(((HOLD_SECONDS[profile.experience] + endurance) * repScale(e) * holdScale) / 5) *
          5,
      ),
      restSeconds: 45 + extraRest,
    };
  }
  const [goalMin, goalMax, rest] = REPS[profile.goal][e.weighted ? 'weighted' : 'bodyweight'];
  const scale = repScale(e);
  const min = Math.max(3, Math.round(goalMin * scale));
  const max = Math.max(min + 1, Math.round(goalMax * scale));
  const target = profile.experience === 'beginner' ? min : Math.round((min + max) / 2);
  return {
    ...base,
    sets,
    repsMin: min,
    repsMax: max,
    targetReps: target,
    restSeconds: rest + extraRest,
  };
}

function warmup(slug: string, rules: Rules, seconds = WARMUP_SECONDS): PlannedItem | null {
  const e =
    rules.bySlug.get(slug) ??
    (rules.bySlug.has('march_in_place') ? rules.bySlug.get('march_in_place') : undefined);
  if (!e) return null;
  return {
    slug: e.slug,
    phase: 'warmup',
    sets: 1,
    repsMin: null,
    repsMax: null,
    targetReps: null,
    seconds,
    distanceM: null,
    restSeconds: WARMUP_REST,
  };
}

function warmups(slugs: readonly string[], rules: Rules): PlannedItem[] {
  const items: PlannedItem[] = [];
  for (const slug of slugs) {
    const item = warmup(slug, rules);
    if (item && !items.some((i) => i.slug === item.slug)) items.push(item);
  }
  return items;
}

/** The best exercise for a slot that is not in the routine yet (null when none fits). */
function pick(
  slot: Slot,
  rules: Rules,
  used: Set<string>,
  usage: Map<string, number>,
  gym: boolean,
) {
  const heavy = rules.profile.goal === 'strength' || rules.profile.goal === 'muscle';
  let best: { e: ExerciseInfo; score: number } | null = null;
  for (const e of rules.available) {
    const patternIndex = slot.indexOf(e.pattern);
    if (patternIndex === -1 || used.has(e.slug) || e.role === 'warmup' || e.role === 'cardio')
      continue;
    const score =
      patternIndex * 20 +
      Math.abs(e.difficulty - rules.targetDifficulty) * 6 +
      (usage.get(e.slug) ?? 0) * 8 +
      (gym && heavy && !e.weighted ? 5 : 0);
    if (!best || score < best.score) best = { e, score };
  }
  return best?.e ?? null;
}

/** Seconds one exercise takes as planned, including rests and moving on. */
export function itemSeconds(
  item: PlannedItem,
  e: Pick<ExerciseInfo, 'metric' | 'secondsPerRep' | 'speed'>,
): number {
  const work =
    e.metric === 'time'
      ? (item.seconds ?? 0)
      : e.metric === 'distance'
        ? (item.distanceM ?? 0) / (e.speed || 1.5)
        : (item.targetReps ?? 0) * e.secondsPerRep;
  return item.sets * work + (item.sets - 1) * item.restSeconds + TRANSITION_SECONDS;
}

export function routineSeconds(
  items: readonly PlannedItem[],
  info: (slug: string) => ExerciseInfo | undefined,
): number {
  return Math.round(
    items.reduce((sum, item) => {
      const e = info(item.slug);
      return e ? sum + itemSeconds(item, e) : sum;
    }, 0),
  );
}

/** Drops main exercises from the end until the routine fits the person's time (keeps 3). */
function fit(items: PlannedItem[], rules: Rules): PlannedItem[] {
  const budget = rules.profile.sessionMinutes * 60;
  const result = [...items];
  const info = (slug: string) => rules.bySlug.get(slug);
  while (
    routineSeconds(result, info) > budget &&
    result.filter((i) => i.phase === 'main').length > 3
  ) {
    result.pop();
  }
  return result;
}

function strengthRoutines(input: GeneratorInput, rules: Rules): PlannedRoutine[] {
  const usage = new Map<string, number>();
  const gym = input.location === 'gym';
  const finisher =
    rules.profile.goal === 'weight_loss' || rules.profile.goal === 'endurance'
      ? rules.available.find((e) => e.role === 'cardio' && e.metric === 'time')
      : undefined;

  return Object.entries(STRENGTH_TEMPLATES).map(([template, slots]) => {
    const used = new Set<string>();
    const main: PlannedItem[] = [];
    for (const slot of [...slots, ...FILL_SLOTS]) {
      if (main.length >= slots.length || (slots.indexOf(slot) === -1 && main.length >= MIN_MAIN))
        break;
      const e = pick(slot, rules, used, usage, gym);
      if (!e) continue;
      used.add(e.slug);
      usage.set(e.slug, (usage.get(e.slug) ?? 0) + 1);
      main.push(prescribe(e, rules.profile, rules.age));
    }
    if (finisher) {
      main.push({
        ...prescribe(finisher, rules.profile, rules.age),
        sets: 1,
        seconds: FINISHER_SECONDS,
        restSeconds: 0,
      });
    }
    const items = [...warmups(STRENGTH_WARMUPS[template] ?? [], rules), ...main];
    return { location: input.location, template, items: fit(items, rules) };
  });
}

function outsideRoutines(input: GeneratorInput, rules: Rules): PlannedRoutine[] {
  const { profile } = rules;
  const budget = profile.sessionMinutes * 60;
  const exp = profile.experience;
  const walkSpeed = rules.bySlug.get('brisk_walk')?.speed ?? 1.6;
  const round100 = (m: number) => Math.max(500, Math.round(m / 100) * 100);
  const distance = (slug: string, meters: number): PlannedItem | null => {
    const e = rules.bySlug.get(slug);
    if (!e) return null;
    return {
      slug,
      phase: 'main',
      sets: 1,
      repsMin: null,
      repsMax: null,
      targetReps: null,
      seconds: null,
      distanceM: round100(meters),
      restSeconds: 60,
    };
  };
  const timed = (slug: string, seconds: number): PlannedItem | null =>
    rules.bySlug.has(slug)
      ? {
          slug,
          phase: 'main',
          sets: 1,
          repsMin: null,
          repsMax: null,
          targetReps: null,
          seconds,
          distanceM: null,
          restSeconds: 0,
        }
      : null;
  const present = (items: (PlannedItem | null)[]) =>
    items.filter((i): i is PlannedItem => i !== null);

  // 1. A brisk walk as long as the time allows.
  const walkWarmups = warmups(['leg_swings', 'hip_circles'], rules);
  const walkBudget = budget - routineSeconds(walkWarmups, (s) => rules.bySlug.get(s));
  const walk = present([
    ...walkWarmups,
    distance('brisk_walk', Math.min(WALK_M[exp], walkBudget * walkSpeed * 0.95)),
  ]);

  // 2. Intervals: run and walk in turns, or fast and easy walking for low impact.
  const intervalWarmups = present([
    warmup('easy_walk', rules, 300),
    ...warmups(['leg_swings'], rules),
  ]);
  const intervalSlug = rules.bySlug.has('run_walk_intervals')
    ? 'run_walk_intervals'
    : 'power_walk_intervals';
  const intervals = present([
    ...intervalWarmups,
    timed(intervalSlug, Math.max(300, Math.min(INTERVAL_S[exp], budget - 420))),
  ]);

  // 3. Park: a short run (or walk), then body-weight exercises.
  const runSlug =
    rules.bySlug.has('run') && exp === 'advanced'
      ? 'run'
      : rules.bySlug.has('jog')
        ? 'jog'
        : 'brisk_walk';
  const usage = new Map<string, number>();
  const used = new Set<string>();
  const circuit: PlannedItem[] = [];
  for (const slot of PARK_SLOTS) {
    const e = pick(slot, rules, used, usage, false);
    if (!e) continue;
    used.add(e.slug);
    circuit.push(prescribe(e, profile, rules.age));
  }
  const park = fit(
    present([
      ...warmups(['jumping_jacks', 'arm_circles'], rules),
      distance(runSlug, runSlug === 'brisk_walk' ? JOG_M[exp] * 1.5 : JOG_M[exp]),
      ...circuit,
    ]),
    rules,
  );

  return [
    { location: 'outside', template: 'walk', items: walk },
    { location: 'outside', template: 'intervals', items: intervals },
    { location: 'outside', template: 'park', items: park },
  ];
}

/** At least three routines for the place, each with its warm-up first. */
export function generateRoutines(input: GeneratorInput): PlannedRoutine[] {
  const rules = rulesFor(input);
  return input.location === 'outside'
    ? outsideRoutines(input, rules)
    : strengthRoutines(input, rules);
}

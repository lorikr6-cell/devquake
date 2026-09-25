import type { Metric } from './catalog';
import { itemSeconds } from './generator';
import type { ExerciseInfo, PlannedItem } from './model';

/**
 * Calorie estimates (ADR 0013): kcal = MET × body weight (kg) × hours. Working time uses the
 * exercise's MET; the rest of the time spent on the exercise (rests, getting ready) counts as
 * standing rest. These are estimates and are always shown as "about".
 */

export const REST_MET = 1.5;

export interface CalorieInput {
  met: number;
  metric: Metric;
  secondsPerRep: number;
  /** Sets done. */
  sets: { reps: number | null; seconds: number | null }[];
  /** Seconds from the exercise's start to its end; null when unknown. */
  totalSeconds: number | null;
}

/** Seconds of actual work in the sets done. */
export function workSeconds(
  input: Pick<CalorieInput, 'metric' | 'secondsPerRep' | 'sets'>,
): number {
  return input.sets.reduce(
    (sum, s) =>
      sum + (input.metric === 'reps' ? (s.reps ?? 0) * input.secondsPerRep : (s.seconds ?? 0)),
    0,
  );
}

export function itemKcal(input: CalorieInput, bodyWeightKg: number): number {
  const work = workSeconds(input);
  const rest = input.totalSeconds === null ? 0 : Math.max(0, input.totalSeconds - work);
  return ((input.met * work + REST_MET * rest) * bodyWeightKg) / 3600;
}

/** Planned: `workSeconds` of work in `totalSeconds`. */
export function plannedKcal(
  met: number,
  work: number,
  total: number,
  bodyWeightKg: number,
): number {
  return ((met * work + REST_MET * Math.max(0, total - work)) * bodyWeightKg) / 3600;
}

/** How long a planned routine takes and about how many kcal it uses. */
export function routineEstimate(
  items: readonly PlannedItem[],
  info: (slug: string) => ExerciseInfo | undefined,
  bodyWeightKg: number,
): { seconds: number; kcal: number } {
  let seconds = 0;
  let kcal = 0;
  for (const item of items) {
    const e = info(item.slug);
    if (!e) continue;
    const total = itemSeconds(item, e);
    const work =
      e.metric === 'reps'
        ? item.sets * (item.targetReps ?? 0) * e.secondsPerRep
        : e.metric === 'time'
          ? item.sets * (item.seconds ?? 0)
          : (item.distanceM ?? 0) / (e.speed || 1.5);
    seconds += total;
    kcal += plannedKcal(e.met, work, total, bodyWeightKg);
  }
  return { seconds: Math.round(seconds), kcal: Math.round(kcal) };
}

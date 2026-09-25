import type { Metric } from './catalog';

/**
 * The suggestion for the next workout from the last one (ADR 0013), per exercise. Double
 * progression: one more repetition each time every set reached the suggestion; at the top of
 * the range, back to the bottom with a little more weight. Falling short by more than 20 %
 * lowers the suggestion by one repetition.
 */

export interface Target {
  reps: number | null;
  seconds: number | null;
  distanceM: number | null;
  weightKg: number | null;
}

export interface Plan {
  metric: Metric;
  sets: number;
  repsMin: number | null;
  repsMax: number | null;
  weighted: boolean;
  /** kg added when moving up (0: bands, where the person picks a harder band). */
  weightStep: number;
}

export interface LastTime {
  target: Target;
  /** Sets the person marked done. */
  sets: {
    reps: number | null;
    seconds: number | null;
    distanceM: number | null;
    weightKg: number | null;
  }[];
}

const SHORT = 0.8;

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function nextTarget(plan: Plan, base: Target, last?: LastTime): Target {
  if (!last || last.sets.length === 0) return base;
  const planned = Math.max(plan.sets, 1);
  const weights = last.sets.map((s) => s.weightKg).filter((w): w is number => w !== null && w > 0);
  const weightKg = weights.length ? Math.max(...weights) : last.target.weightKg;

  if (plan.metric === 'reps') {
    const target = last.target.reps ?? base.reps ?? 1;
    const done = last.sets.map((s) => s.reps ?? 0);
    const allHit = done.length >= planned && done.every((r) => r >= target);
    const ratio = done.reduce((a, b) => a + b, 0) / (target * planned);
    const min = plan.repsMin ?? 1;
    const max = plan.repsMax ?? target;
    if (allHit) {
      if (target >= max && plan.weighted && weightKg && plan.weightStep > 0) {
        return { ...base, reps: min, weightKg: weightKg + plan.weightStep };
      }
      const cap = plan.weighted ? max : max * 2;
      return { ...base, reps: Math.min(target + 1, Math.max(cap, target)), weightKg };
    }
    if (ratio < SHORT) return { ...base, reps: Math.max(1, target - 1), weightKg };
    return { ...base, reps: target, weightKg };
  }

  if (plan.metric === 'time') {
    const target = last.target.seconds ?? base.seconds ?? 30;
    const done = last.sets.map((s) => s.seconds ?? 0);
    const allHit = done.length >= planned && done.every((s) => s >= target);
    const ratio = done.reduce((a, b) => a + b, 0) / (target * planned);
    if (allHit) {
      const step = target < 60 ? 5 : Math.max(5, roundTo(target * 0.1, 5));
      return { ...base, seconds: target + step };
    }
    if (ratio < SHORT) return { ...base, seconds: Math.max(10, target - 5) };
    return { ...base, seconds: target };
  }

  const target = last.target.distanceM ?? base.distanceM ?? 1000;
  const best = Math.max(...last.sets.map((s) => s.distanceM ?? 0));
  if (best >= target) return { ...base, distanceM: roundTo(target * 1.1, 100) };
  return { ...base, distanceM: target };
}

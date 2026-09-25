import { describe, expect, it } from 'vitest';
import { itemKcal, workSeconds } from './calories';
import { nextTarget, type Plan, type Target } from './progression';

const reps: Plan = {
  metric: 'reps',
  sets: 3,
  repsMin: 8,
  repsMax: 12,
  weighted: true,
  weightStep: 2.5,
};
const base: Target = { reps: 10, seconds: null, distanceM: null, weightKg: null };
const sets = (...values: number[]) =>
  values.map((r) => ({ reps: r, seconds: null, distanceM: null, weightKg: 40 }));

describe('nextTarget', () => {
  it('keeps the plan without history', () => {
    expect(nextTarget(reps, base)).toEqual(base);
  });

  it('adds a repetition when every set reached the target', () => {
    const t = nextTarget(reps, base, { target: { ...base, weightKg: 40 }, sets: sets(10, 10, 11) });
    expect(t).toMatchObject({ reps: 11, weightKg: 40 });
  });

  it('moves up in weight at the top of the range', () => {
    const t = nextTarget(reps, base, { target: { ...base, reps: 12 }, sets: sets(12, 12, 12) });
    expect(t).toMatchObject({ reps: 8, weightKg: 42.5 });
  });

  it('keeps the target after a near miss, lowers it after a clear miss', () => {
    expect(nextTarget(reps, base, { target: base, sets: sets(10, 9, 8) }).reps).toBe(10);
    expect(nextTarget(reps, base, { target: base, sets: sets(8, 6, 5) }).reps).toBe(9);
  });

  it('counts sets that were not done as a miss', () => {
    expect(nextTarget(reps, base, { target: base, sets: sets(10) }).reps).toBe(9);
  });

  it('lets body-weight exercises go past the top of the range', () => {
    const bw: Plan = { ...reps, weighted: false, weightStep: 0 };
    const t = nextTarget(bw, base, { target: { ...base, reps: 12 }, sets: sets(12, 12, 12) });
    expect(t.reps).toBe(13);
  });

  it('lengthens holds by 5 seconds, or 10 % above a minute', () => {
    const time: Plan = {
      metric: 'time',
      sets: 2,
      repsMin: null,
      repsMax: null,
      weighted: false,
      weightStep: 0,
    };
    const hold = (s: number) => ({ reps: null, seconds: s, distanceM: null, weightKg: null });
    const t30 = { reps: null, seconds: 30, distanceM: null, weightKg: null };
    expect(nextTarget(time, t30, { target: t30, sets: [hold(30), hold(32)] }).seconds).toBe(35);
    const t90 = { ...t30, seconds: 90 };
    expect(nextTarget(time, t90, { target: t90, sets: [hold(90), hold(90)] }).seconds).toBe(100);
    expect(nextTarget(time, t30, { target: t30, sets: [hold(10), hold(10)] }).seconds).toBe(25);
  });

  it('lengthens a distance by 10 % once it was reached', () => {
    const dist: Plan = {
      metric: 'distance',
      sets: 1,
      repsMin: null,
      repsMax: null,
      weighted: false,
      weightStep: 0,
    };
    const t = { reps: null, seconds: null, distanceM: 3000, weightKg: null };
    const done = { reps: null, seconds: 1900, distanceM: 3050, weightKg: null };
    expect(nextTarget(dist, t, { target: t, sets: [done] }).distanceM).toBe(3300);
  });
});

describe('calories', () => {
  it('counts work at the exercise MET and the rest as standing rest', () => {
    const input = {
      met: 5,
      metric: 'reps' as const,
      secondsPerRep: 3,
      sets: [
        { reps: 10, seconds: null },
        { reps: 10, seconds: null },
      ],
      totalSeconds: 240,
    };
    expect(workSeconds(input)).toBe(60);
    // (5 × 60 + 1.5 × 180) × 80 / 3600 = 12.67
    expect(itemKcal(input, 80)).toBeCloseTo(12.67, 2);
  });

  it('uses only the work when the duration is unknown', () => {
    const input = {
      met: 8,
      metric: 'time' as const,
      secondsPerRep: 3,
      sets: [{ reps: null, seconds: 45 }],
      totalSeconds: null,
    };
    expect(itemKcal(input, 90)).toBeCloseTo(9, 5);
  });
});

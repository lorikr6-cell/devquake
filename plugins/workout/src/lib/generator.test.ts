import { describe, expect, it } from 'vitest';
import { routineEstimate } from './calories';
import { EXERCISES, exerciseDef } from './catalog';
import { complexity, generateRoutines, prescribe, repScale, routineSeconds } from './generator';
import type { Profile } from './model';

const profile: Profile = {
  birthYear: 1990,
  heightCm: 178,
  weightKg: 80,
  weightUnit: 'kg',
  heightUnit: 'cm',
  experience: 'intermediate',
  goal: 'muscle',
  daysPerWeek: 3,
  sessionMinutes: 60,
  lowImpact: false,
};

const run = (p: Partial<Profile>, location: 'gym' | 'home' | 'outside', equipment: string[] = []) =>
  generateRoutines({
    profile: { ...profile, ...p },
    location,
    equipment,
    catalogue: EXERCISES,
    year: 2026,
  });

const slugs = (routine: { items: { slug: string }[] }) => routine.items.map((i) => i.slug);

describe('generateRoutines', () => {
  it('makes three routines per place, each starting with a warm-up', () => {
    for (const location of ['gym', 'home', 'outside'] as const) {
      const routines = run({}, location);
      expect(routines).toHaveLength(3);
      for (const r of routines) {
        expect(r.items[0]?.phase).toBe('warmup');
        expect(r.items.some((i) => i.phase === 'main')).toBe(true);
      }
    }
  });

  it('is deterministic', () => {
    expect(run({}, 'gym')).toEqual(run({}, 'gym'));
  });

  it('never repeats an exercise inside a routine', () => {
    for (const r of [...run({}, 'gym'), ...run({}, 'home', ['dumbbells', 'bench'])]) {
      expect(new Set(slugs(r)).size).toBe(r.items.length);
    }
  });

  it('only uses the equipment the person has at home', () => {
    const owned = ['dumbbells'];
    for (const r of run({}, 'home', owned)) {
      for (const slug of slugs(r)) {
        expect(exerciseDef(slug)!.equipment.every((e) => owned.includes(e))).toBe(true);
      }
    }
  });

  it('falls back to body weight at home without equipment', () => {
    const routines = run({}, 'home', []);
    for (const r of routines) {
      expect(r.items.filter((i) => i.phase === 'main').length).toBeGreaterThanOrEqual(3);
      for (const slug of slugs(r)) expect(exerciseDef(slug)!.equipment).toEqual([]);
    }
  });

  it('prefers weights at the gym for muscle and strength goals', () => {
    const [full] = run({ goal: 'strength' }, 'gym');
    const weighted = full!.items.filter((i) => exerciseDef(i.slug)!.weighted);
    expect(weighted.length).toBeGreaterThanOrEqual(3);
    const first = full!.items.find((i) => exerciseDef(i.slug)!.weighted)!;
    expect(first.sets).toBe(4);
    expect(first.repsMax!).toBeLessThanOrEqual(8);
  });

  it('keeps jumping and running out for low impact', () => {
    for (const location of ['gym', 'home', 'outside'] as const) {
      for (const r of run({ lowImpact: true }, location)) {
        for (const slug of slugs(r)) expect(exerciseDef(slug)!.lowImpact, slug).toBe(true);
      }
    }
  });

  it('gives beginners fewer sets and the bottom of the range', () => {
    const [full] = run({ experience: 'beginner', goal: 'general' }, 'gym');
    const main = full!.items.filter((i) => i.phase === 'main' && i.repsMin !== null);
    for (const item of main) {
      expect(item.sets).toBe(2);
      expect(item.targetReps).toBe(item.repsMin);
    }
  });

  it('gives people over 60 easier exercises and longer rests', () => {
    const [full] = run({ birthYear: 1950, experience: 'advanced' }, 'gym');
    for (const item of full!.items)
      expect(exerciseDef(item.slug)!.difficulty).toBeLessThanOrEqual(2);
    const squat = exerciseDef('db_goblet_squat')!;
    expect(prescribe(squat, profile, 'older').restSeconds).toBe(
      prescribe(squat, profile, 'adult').restSeconds + 30,
    );
  });

  it('fits the routine into the time the person has', () => {
    const info = (slug: string) => exerciseDef(slug);
    for (const r of run({ sessionMinutes: 20 }, 'gym')) {
      const main = r.items.filter((i) => i.phase === 'main').length;
      expect(main === 3 || routineSeconds(r.items, info) <= 20 * 60).toBe(true);
    }
    const long = run({ sessionMinutes: 90 }, 'gym')[1]!;
    expect(long.items.filter((i) => i.phase === 'main').length).toBe(7);
  });

  it('adds a cardio finisher for weight loss', () => {
    const [full] = run({ goal: 'weight_loss', sessionMinutes: 90 }, 'gym');
    const last = full!.items.at(-1)!;
    expect(exerciseDef(last.slug)!.role).toBe('cardio');
    expect(last.seconds).toBe(600);
  });

  it('plans outside routines: a walk, intervals and a park workout', () => {
    const [walk, intervals, park] = run({}, 'outside');
    expect(walk!.template).toBe('walk');
    expect(walk!.items.at(-1)).toMatchObject({ slug: 'brisk_walk', distanceM: 3500 });
    expect(intervals!.items.at(-1)).toMatchObject({ slug: 'run_walk_intervals', seconds: 1200 });
    expect(park!.items.find((i) => i.phase === 'main')!.slug).toBe('jog');
    const lowImpact = run({ lowImpact: true }, 'outside');
    expect(lowImpact[1]!.items.at(-1)!.slug).toBe('power_walk_intervals');
    expect(lowImpact[2]!.items.find((i) => i.phase === 'main')!.slug).toBe('brisk_walk');
  });

  it('estimates time and calories', () => {
    const [full] = run({}, 'gym');
    const estimate = routineEstimate(full!.items, exerciseDef, 80);
    expect(estimate.seconds).toBeGreaterThan(15 * 60);
    expect(estimate.seconds).toBeLessThanOrEqual(60 * 60);
    expect(estimate.kcal).toBeGreaterThan(50);
    expect(estimate.kcal).toBeLessThan(600);
  });
});

describe('repetitions by complexity', () => {
  const bw = (slug: string) => prescribe(exerciseDef(slug)!, profile, 'adult');

  it('rates pull-ups as harder than push-ups, and calf raises as easiest', () => {
    const c = (slug: string) => complexity(exerciseDef(slug)!);
    expect(c('pull_up')).toBeGreaterThan(c('push_up'));
    expect(c('push_up')).toBeGreaterThan(c('calf_raise'));
  });

  it('suggests fewer repetitions for harder exercises', () => {
    // Muscle goal, body weight: 8–15 before scaling.
    expect(bw('pull_up')).toMatchObject({ repsMin: 5, repsMax: 9 });
    expect(bw('push_up')).toMatchObject({ repsMin: 8, repsMax: 15 });
    expect(bw('calf_raise').repsMax!).toBeGreaterThan(15);
    expect(bw('pull_up').targetReps!).toBeLessThan(bw('push_up').targetReps!);
  });

  it('scales weighted exercises only half as much', () => {
    const e = exerciseDef('bb_deadlift')!;
    expect(repScale(e)).toBeCloseTo(1 + (repScale({ ...e, weighted: false }) - 1) / 2, 5);
  });

  it('scales holds too', () => {
    expect(bw('plank').seconds!).toBeGreaterThan(bw('side_plank').seconds!);
  });
});

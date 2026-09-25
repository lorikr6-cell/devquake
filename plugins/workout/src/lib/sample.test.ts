import { describe, expect, it } from 'vitest';
import { SAMPLE_WEEK, workoutVolume } from './sample';

describe('sample week', () => {
  it('has workouts on distinct weekdays, in order', () => {
    const days = SAMPLE_WEEK.map((w) => w.day);
    expect(days).toEqual([...new Set(days)].sort((a, b) => a - b));
    for (const d of days) expect(d).toBeGreaterThanOrEqual(1);
    for (const d of days) expect(d).toBeLessThanOrEqual(7);
  });

  it('counts volume as sets × reps × weight, body weight as 0', () => {
    expect(
      workoutVolume({
        key: 'x',
        day: 1,
        exercises: [
          { exercise: 'bench', sets: 4, reps: 8, weightKg: 60 },
          { exercise: 'pullUps', sets: 3, reps: 8, weightKg: 0 },
        ],
      }),
    ).toBe(1920);
  });
});

import { describe, expect, it } from 'vitest';
import { HttpError } from './http';
import { planInput, routineInput } from './routine-input';

const catalogue = new Map([
  ['push_up', { slug: 'push_up', metric: 'reps' as const, places: ['gym', 'home'] as const }],
  ['plank', { slug: 'plank', metric: 'time' as const, places: ['gym', 'home'] as const }],
  ['run', { slug: 'run', metric: 'distance' as const, places: ['outside'] as const }],
]);

const errorKey = (fn: () => unknown) => {
  try {
    fn();
  } catch (err) {
    return (err as HttpError).key;
  }
  return null;
};

describe('routineInput', () => {
  it('keeps only the fields of each exercise’s metric', () => {
    const input = routineInput(
      {
        name: '  Morning   push ',
        location: 'home',
        items: [
          { slug: 'push_up', sets: 3, repsMin: 8, repsMax: 12, seconds: 99, restSeconds: 60 },
          { slug: 'plank', phase: 'warmup', sets: 2, seconds: 30, repsMin: 5 },
        ],
      },
      catalogue,
    );
    expect(input.name).toBe('Morning push');
    expect(input.items[0]).toMatchObject({ repsMin: 8, repsMax: 12, targetReps: 8, seconds: null });
    expect(input.items[1]).toMatchObject({ phase: 'warmup', seconds: 30, repsMin: null });
  });

  it('rejects empty routines, unknown exercises and exercises of another place', () => {
    expect(
      errorKey(() => routineInput({ name: 'A', location: 'home', items: [] }, catalogue)),
    ).toBe('routineEmpty');
    expect(
      errorKey(() =>
        routineInput(
          { name: 'A', location: 'home', items: [{ slug: 'nope', sets: 1 }] },
          catalogue,
        ),
      ),
    ).toBe('unknownExercise');
    expect(
      errorKey(() =>
        routineInput(
          { name: 'A', location: 'home', items: [{ slug: 'run', distanceM: 2000 }] },
          catalogue,
        ),
      ),
    ).toBe('exercisePlace');
    expect(
      errorKey(() => routineInput({ name: ' ', location: 'home', items: [] }, catalogue)),
    ).toBe('routineName');
  });

  it('needs the highest repetitions to be at least the lowest', () => {
    expect(
      errorKey(() =>
        routineInput(
          {
            name: 'A',
            location: 'gym',
            items: [{ slug: 'push_up', sets: 3, repsMin: 10, repsMax: 5 }],
          },
          catalogue,
        ),
      ),
    ).toBe('range');
  });
});

describe('planInput', () => {
  it('reads every-day and weekday slots', () => {
    expect(planInput({ routineId: 3, weekday: 'daily', start: '06:45', duration: 40 })).toEqual({
      routineId: 3,
      weekday: null,
      start: 405,
      duration: 40,
      remindMinutes: null,
    });
    expect(
      planInput({ routineId: 3, weekday: 2, start: '06:45', duration: 40, remindMinutes: 30 })
        .remindMinutes,
    ).toBe(30);
    expect(
      errorKey(() =>
        planInput({ routineId: 3, weekday: 2, start: '06:45', duration: 40, remindMinutes: 45 }),
      ),
    ).toBe('choice');
    expect(planInput({ routineId: 3, weekday: 5, start: '18:00', duration: 60 }).weekday).toBe(5);
  });

  it('rejects bad times, days and slots past midnight', () => {
    expect(
      errorKey(() => planInput({ routineId: 3, weekday: 8, start: '06:00', duration: 30 })),
    ).toBe('choice');
    expect(
      errorKey(() => planInput({ routineId: 3, weekday: 1, start: '6pm', duration: 30 })),
    ).toBe('planTime');
    expect(
      errorKey(() => planInput({ routineId: 3, weekday: 1, start: '23:30', duration: 45 })),
    ).toBe('planMidnight');
  });
});

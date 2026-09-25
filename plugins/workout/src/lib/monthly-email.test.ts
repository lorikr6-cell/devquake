import { describe, expect, it } from 'vitest';
import { monthlyEmail, reportMonth } from './monthly-email';
import type { WorkoutStat } from './stats';

const w = (startedAt: string): WorkoutStat => ({
  id: 1,
  template: 'full_body',
  routineName: null,
  startedAt,
  seconds: 2400,
  kcal: 210,
  setsDone: 12,
  setsPlanned: 12,
  reps: 120,
  volumeKg: 900,
});

describe('monthly email', () => {
  it('waits until the month has ended everywhere, then reports the month before', () => {
    expect(reportMonth(new Date('2026-10-01T06:00:00Z'))).toBeNull();
    const r = reportMonth(new Date('2026-10-01T13:00:00Z'))!;
    expect(r.month).toBe('2026-09');
    expect(r.from.toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(r.to.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(reportMonth(new Date('2027-01-15T00:00:00Z'))!.month).toBe('2026-12');
  });

  it('summarises the month in the person’s language with a link to its calendar', () => {
    const email = monthlyEmail({
      locale: 'de',
      month: '2026-09',
      baseUrl: 'https://workout.devquake.com',
      workouts: [w('2026-09-01T10:00:00Z'), w('2026-09-02T10:00:00Z')],
      previous: [w('2026-08-10T10:00:00Z')],
      hasMonthPhoto: false,
    });
    expect(email.subject).toContain('September 2026');
    expect(email.button!.url).toBe(
      'https://workout.devquake.com/de/history?view=month&date=2026-09',
    );
    expect(email.footer).toContain('https://workout.devquake.com/de/profile');
    expect(email.rows!.find(([, v]) => v === '2')).toBeDefined();
    expect(email.paragraphs).toHaveLength(2); // feedback + photo reminder
  });

  it('encourages a start when there were no workouts', () => {
    const email = monthlyEmail({
      locale: 'en',
      month: '2026-09',
      baseUrl: 'https://workout.devquake.com',
      workouts: [],
      previous: [],
      hasMonthPhoto: true,
    });
    expect(email.rows).toBeUndefined();
    expect(email.paragraphs).toHaveLength(1);
  });
});

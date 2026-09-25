import { describe, expect, it } from 'vitest';
import {
  feedbackKey,
  groupByDay,
  heat,
  localDay,
  longestStreak,
  monthGrid,
  parsePeriod,
  shiftMonth,
  totals,
  utcWindow,
  type WorkoutStat,
} from './stats';

const w = (startedAt: string, p: Partial<WorkoutStat> = {}): WorkoutStat => ({
  id: 1,
  template: 'full_body',
  routineName: null,
  startedAt,
  seconds: 1800,
  kcal: 150,
  setsDone: 9,
  setsPlanned: 10,
  reps: 90,
  volumeKg: 500,
  ...p,
});

describe('calendar statistics', () => {
  it("groups workouts by the viewer's day, not the UTC day", () => {
    // 23:30 UTC on 30 September is already 1 October in Bucharest (UTC+3).
    expect(localDay('2026-09-30T23:30:00Z', 'Europe/Bucharest')).toBe('2026-10-01');
    expect(localDay('2026-09-30T23:30:00Z', 'UTC')).toBe('2026-09-30');
    const days = groupByDay(
      [w('2026-09-30T23:30:00Z'), w('2026-10-01T08:00:00Z')],
      'Europe/Bucharest',
    );
    expect([...days.keys()]).toEqual(['2026-10-01']);
  });

  it('adds up a period', () => {
    const t = totals([
      w('2026-09-01T10:00:00Z'),
      w('2026-09-01T18:00:00Z', { kcal: null }),
      w('2026-09-03T10:00:00Z'),
    ]);
    expect(t).toMatchObject({
      workouts: 3,
      activeDays: 2,
      seconds: 5400,
      kcal: 300,
      reps: 270,
      completion: 90,
    });
  });

  it('finds the longest streak of days', () => {
    expect(
      longestStreak(['2026-09-01', '2026-09-02', '2026-09-04', '2026-09-05', '2026-09-06']),
    ).toBe(3);
    expect(longestStreak(['2026-12-31', '2027-01-01'])).toBe(2);
    expect(longestStreak([])).toBe(0);
  });

  it('lays a month out in weeks starting on Monday', () => {
    const weeks = monthGrid(2026, 9); // 1 September 2026 is a Tuesday
    expect(weeks[0]).toEqual([
      null,
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
    ]);
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
    for (const week of weeks) expect(week).toHaveLength(7);
  });

  it('reads a day either side of the period in UTC', () => {
    const [from, to] = utcWindow('2026-09-01', '2026-09-30');
    expect(from.toISOString()).toBe('2026-08-31T00:00:00.000Z');
    expect(to.toISOString()).toBe('2026-10-02T00:00:00.000Z');
  });

  it('reads the period from the address and falls back to today', () => {
    const today = '2026-09-25';
    expect(parsePeriod('day', '2026-02-28', today)).toEqual({ view: 'day', day: '2026-02-28' });
    expect(parsePeriod('day', '2026-02-30', today)).toEqual({ view: 'day', day: today });
    expect(parsePeriod('month', '2026-07', today)).toEqual({ view: 'month', year: 2026, month: 7 });
    expect(parsePeriod(undefined, undefined, today)).toEqual({
      view: 'month',
      year: 2026,
      month: 9,
    });
    expect(parsePeriod('year', '1800', today)).toEqual({ view: 'year', year: 2026 });
  });

  it('moves between months across years', () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it('grades the calendar heat and the feedback', () => {
    expect([0, 600, 1800, 3000, 5400].map(heat)).toEqual([0, 1, 2, 3, 4]);
    const none = totals([]);
    const one = totals([w('2026-09-01T10:00:00Z')]);
    const two = totals([w('2026-09-01T10:00:00Z'), w('2026-09-02T10:00:00Z')]);
    expect(feedbackKey(none, null)).toBe('none');
    expect(feedbackKey(one, none)).toBe('first');
    expect(feedbackKey(two, one)).toBe('up');
    expect(feedbackKey(one, one)).toBe('strong');
    const half = totals([w('2026-09-01T10:00:00Z', { setsDone: 5 })]);
    expect(feedbackKey(half, one)).toBe('steady');
  });
});

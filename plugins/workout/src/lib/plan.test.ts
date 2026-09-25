import { describe, expect, it } from 'vitest';
import {
  defaultDuration,
  findOverlap,
  formatTime,
  overlaps,
  parseTime,
  slotsForDay,
  weekdayIn,
  type PlanSlot,
} from './plan';

const slot = (p: Partial<PlanSlot>): PlanSlot => ({
  routineId: 1,
  weekday: 1,
  start: 7 * 60,
  duration: 45,
  ...p,
});

describe('overlaps', () => {
  it('finds slots on the same day whose times intersect', () => {
    expect(overlaps(slot({}), slot({ start: 7 * 60 + 30 }))).toBe(true);
    expect(overlaps(slot({}), slot({ start: 6 * 60 + 30, duration: 60 }))).toBe(true);
  });

  it('allows slots that only touch, or are on other days', () => {
    expect(overlaps(slot({}), slot({ start: 7 * 60 + 45 }))).toBe(false);
    expect(overlaps(slot({}), slot({ weekday: 2 }))).toBe(false);
  });

  it('treats an every-day slot as being on each weekday', () => {
    expect(overlaps(slot({ weekday: null }), slot({ weekday: 6, start: 7 * 60 + 10 }))).toBe(true);
    expect(overlaps(slot({ weekday: null }), slot({ weekday: null, start: 18 * 60 }))).toBe(false);
  });

  it('ignores the slot being edited', () => {
    const existing = [slot({ id: 4 })];
    expect(findOverlap(existing, slot({ start: 7 * 60 + 5 }), 4)).toBeNull();
    expect(findOverlap(existing, slot({ start: 7 * 60 + 5 }))?.id).toBe(4);
  });
});

describe('slotsForDay', () => {
  it('lists a day with its every-day slots, earliest first', () => {
    const slots = [
      slot({ id: 1, weekday: 3, start: 18 * 60 }),
      slot({ id: 2, weekday: null, start: 6 * 60 }),
      slot({ id: 3, weekday: 4 }),
    ];
    expect(slotsForDay(slots, 3).map((s) => s.id)).toEqual([2, 1]);
  });
});

describe('times', () => {
  it('parses and formats wall-clock times', () => {
    expect(parseTime('07:30')).toBe(450);
    expect(parseTime('7:05')).toBe(425);
    expect(parseTime('24:00')).toBeNull();
    expect(parseTime('12:60')).toBeNull();
    expect(formatTime(450)).toBe('07:30');
    expect(formatTime(1440)).toBe('24:00');
  });

  it('gives the weekday in the person’s time zone', () => {
    // Sunday 23:30 UTC is already Monday in Bucharest.
    const date = new Date('2026-09-27T23:30:00Z');
    expect(weekdayIn(date, 'UTC')).toBe(7);
    expect(weekdayIn(date, 'Europe/Bucharest')).toBe(1);
  });

  it('rounds the default length up to 5 minutes', () => {
    expect(defaultDuration(31 * 60)).toBe(35);
    expect(defaultDuration(10)).toBe(5);
  });
});

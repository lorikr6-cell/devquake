import { describe, expect, it } from 'vitest';
import {
  formatDateTime,
  isTimeZone,
  localDateTimeToUtc,
  sqlOffset,
  utcOffsetMinutes,
} from '@devquake/ui';

const moment = new Date('2026-09-24T11:03:00Z');

describe('formatDateTime', () => {
  it('shows the time in the viewer’s zone, with the zone name', () => {
    expect(formatDateTime(moment, 'Europe/Bucharest')).toMatch(
      /24 Sept? 2026, 14:03 (EEST|GMT\+3)/,
    );
    expect(formatDateTime(moment, 'America/New_York')).toMatch(/24 Sept? 2026, 07:03 (EDT|GMT-4)/);
    expect(formatDateTime(moment, 'UTC')).toMatch(/24 Sept? 2026, 11:03 UTC/);
  });

  it('crosses midnight correctly', () => {
    const late = new Date('2026-09-24T22:30:00Z');
    expect(formatDateTime(late, 'Europe/Bucharest', 'date')).toMatch(/^25 Sept? 2026$/);
    expect(formatDateTime(late, 'UTC', 'date')).toMatch(/^24 Sept? 2026$/);
  });

  it('handles empty values and unknown zones', () => {
    expect(formatDateTime(null, 'UTC')).toBe('—');
    expect(formatDateTime('not a date', 'UTC')).toBe('—');
    expect(formatDateTime(moment, 'Mars/Olympus', 'time')).toMatch(/11:03 UTC/);
    expect(isTimeZone('Europe/Bucharest')).toBe(true);
    expect(isTimeZone('Mars/Olympus')).toBe(false);
    expect(isTimeZone("x'; DROP")).toBe(false);
  });
});

describe('offsets', () => {
  it('follows daylight saving', () => {
    expect(utcOffsetMinutes('Europe/Bucharest', new Date('2026-07-01T12:00:00Z'))).toBe(180);
    expect(utcOffsetMinutes('Europe/Bucharest', new Date('2026-12-01T12:00:00Z'))).toBe(120);
    expect(utcOffsetMinutes('Asia/Kolkata', moment)).toBe(330);
    expect(utcOffsetMinutes('America/New_York', new Date('2026-12-01T12:00:00Z'))).toBe(-300);
    expect(sqlOffset(330)).toBe('+05:30');
    expect(sqlOffset(-300)).toBe('-05:00');
    expect(sqlOffset(0)).toBe('+00:00');
  });
});

describe('localDateTimeToUtc (what users type is stored as UTC)', () => {
  it('converts wall-clock times from the user’s zone', () => {
    expect(localDateTimeToUtc('2026-09-24T14:03', 'Europe/Bucharest')?.toISOString()).toBe(
      '2026-09-24T11:03:00.000Z',
    );
    expect(localDateTimeToUtc('2026-12-24 09:00', 'Europe/Bucharest')?.toISOString()).toBe(
      '2026-12-24T07:00:00.000Z',
    );
    expect(localDateTimeToUtc('2026-09-24T14:03', 'America/New_York')?.toISOString()).toBe(
      '2026-09-24T18:03:00.000Z',
    );
  });

  it('round-trips with formatDateTime', () => {
    const utc = localDateTimeToUtc('2026-03-29T12:00', 'Europe/Bucharest')!;
    expect(formatDateTime(utc, 'Europe/Bucharest', 'time')).toMatch(/^12:00/);
  });

  it('refuses invalid input', () => {
    expect(localDateTimeToUtc('2026-02-30T10:00', 'UTC')).toBeNull();
    expect(localDateTimeToUtc('yesterday', 'UTC')).toBeNull();
  });
});

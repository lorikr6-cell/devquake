// Calendar dates as "YYYY-MM-DD" strings (no time, no timezone) and helpers for the calendar.
// Pure functions: used by pages, client components, the API and tests. Weeks start on Monday.

export type IsoDate = string;

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const pad = (n: number) => String(n).padStart(2, '0');

/** A local Date as "YYYY-MM-DD" (the user's own calendar day, not UTC). */
export function toIsoDate(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Noon local time, so adding days never trips over daylight-saving changes. */
export function fromIsoDate(iso: IsoDate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, m! - 1, d!, 12);
}

/** True for a real calendar day, e.g. rejects 2026-02-30. */
export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) return false;
  const date = fromIsoDate(value);
  return toIsoDate(date) === value && date.getFullYear() >= 2000 && date.getFullYear() <= 2100;
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = fromIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/** First day of the month plus `months` (e.g. -1 = previous month). */
export function addMonths(iso: IsoDate, months: number): IsoDate {
  const date = fromIsoDate(iso);
  return toIsoDate(new Date(date.getFullYear(), date.getMonth() + months, 1, 12));
}

/** Monday of the week containing `iso`. */
export function startOfWeek(iso: IsoDate): IsoDate {
  const day = (fromIsoDate(iso).getDay() + 6) % 7; // Monday = 0
  return addDays(iso, -day);
}

export function weekDays(iso: IsoDate): IsoDate[] {
  const monday = startOfWeek(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/**
 * Weeks (Monday..Sunday) covering the month of `iso`, each day as a date string; days of the
 * neighbouring months are included to fill the first and last week.
 */
export function monthGrid(iso: IsoDate): IsoDate[][] {
  const first = `${iso.slice(0, 7)}-01`;
  const month = iso.slice(0, 7);
  const weeks: IsoDate[][] = [];
  let day = startOfWeek(first);
  while (weeks.length === 0 || day.slice(0, 7) === month) {
    const week = Array.from({ length: 7 }, (_, i) => addDays(day, i));
    weeks.push(week);
    day = addDays(day, 7);
  }
  return weeks;
}

export const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function formatDay(iso: IsoDate, style: 'long' | 'short' = 'long'): string {
  return fromIsoDate(iso).toLocaleDateString('en-GB', {
    weekday: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: style === 'long' ? 'numeric' : undefined,
  });
}

export function formatMonth(iso: IsoDate): string {
  return fromIsoDate(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

/**
 * Calendar statistics (ADR 0015): workouts grouped by the viewer's day, totals, streaks and
 * the calendar grid. Pure functions: the pages give them the finished workouts of a period.
 */

export interface WorkoutStat {
  id: number;
  template: string | null;
  routineName: string | null;
  /** ISO time (UTC). */
  startedAt: string;
  seconds: number;
  kcal: number | null;
  setsDone: number;
  setsPlanned: number;
  reps: number;
  volumeKg: number;
}

export interface Totals {
  workouts: number;
  activeDays: number;
  seconds: number;
  kcal: number;
  setsDone: number;
  setsPlanned: number;
  reps: number;
  volumeKg: number;
  /** Sets done out of those planned, 0–100. */
  completion: number;
}

/** "YYYY-MM-DD" of an instant in a time zone. */
export function localDay(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function groupByDay(workouts: readonly WorkoutStat[], timeZone: string) {
  const days = new Map<string, WorkoutStat[]>();
  for (const w of workouts) {
    const day = localDay(w.startedAt, timeZone);
    days.set(day, [...(days.get(day) ?? []), w]);
  }
  return days;
}

export function totals(workouts: readonly WorkoutStat[], timeZone = 'UTC'): Totals {
  const sum = (f: (w: WorkoutStat) => number) => workouts.reduce((n, w) => n + f(w), 0);
  const setsDone = sum((w) => w.setsDone);
  const setsPlanned = sum((w) => w.setsPlanned);
  return {
    workouts: workouts.length,
    activeDays: groupByDay(workouts, timeZone).size,
    seconds: sum((w) => w.seconds),
    kcal: Math.round(sum((w) => w.kcal ?? 0)),
    setsDone,
    setsPlanned,
    reps: sum((w) => w.reps),
    volumeKg: Math.round(sum((w) => w.volumeKg)),
    completion: setsPlanned ? Math.round((setsDone / setsPlanned) * 100) : 0,
  };
}

const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** The longest run of consecutive days with a workout. */
export function longestStreak(days: Iterable<string>): number {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let previous = '';
  for (const day of sorted) {
    run = previous && addDays(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Weeks of a month, Monday first; null for the days of the neighbouring months. */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Sunday
  const lead = (first + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  const mm = String(month).padStart(2, '0');
  for (let d = 1; d <= daysInMonth(year, month); d++) {
    cells.push(`${year}-${mm}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/**
 * The UTC window to read for a local period: a day either side, because the viewer's day can
 * start up to 14 hours before or after UTC midnight. Pages then keep what falls on their days.
 */
export function utcWindow(firstDay: string, lastDay: string): [Date, Date] {
  return [
    new Date(`${addDays(firstDay, -1)}T00:00:00Z`),
    new Date(`${addDays(lastDay, 2)}T00:00:00Z`),
  ];
}

/** Intensity 0–4 of a day for the calendar heat (by minutes worked out). */
export function heat(seconds: number): 0 | 1 | 2 | 3 | 4 {
  const minutes = seconds / 60;
  if (minutes <= 0) return 0;
  if (minutes < 20) return 1;
  if (minutes < 40) return 2;
  if (minutes < 70) return 3;
  return 4;
}

export type Period =
  | { view: 'day'; day: string }
  | { view: 'month'; year: number; month: number }
  | { view: 'year'; year: number };

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH = /^(\d{4})-(\d{2})$/;

/** The period asked for in the address (?view=&date=), falling back to `today`. */
export function parsePeriod(view: unknown, date: unknown, today: string): Period {
  const [ty, tm] = today.split('-').map(Number) as [number, number];
  const d = typeof date === 'string' ? date : '';
  const validYear = (y: number) => y >= 2000 && y <= 2100;
  if (view === 'day') {
    const m = DAY.exec(d);
    if (
      m &&
      validYear(+m[1]!) &&
      +m[2]! >= 1 &&
      +m[2]! <= 12 &&
      +m[3]! >= 1 &&
      +m[3]! <= daysInMonth(+m[1]!, +m[2]!)
    ) {
      return { view: 'day', day: d };
    }
    return { view: 'day', day: today };
  }
  if (view === 'year') {
    const y = Number(d.slice(0, 4));
    return { view: 'year', year: validYear(y) ? y : ty };
  }
  const m = MONTH.exec(d.slice(0, 7));
  if (m && validYear(+m[1]!) && +m[2]! >= 1 && +m[2]! <= 12) {
    return { view: 'month', year: +m[1]!, month: +m[2]! };
  }
  return { view: 'month', year: ty, month: tm };
}

export const monthKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, '0')}`;

/** The month before/after, as { year, month }. */
export function shiftMonth(year: number, month: number, by: number) {
  const index = year * 12 + (month - 1) + by;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export { addDays };

/**
 * Which encouragement fits a period (a key of the texts' feedback.*): nothing yet, a first
 * step, steady, more than last time, or a strong period.
 */
export function feedbackKey(
  current: Totals,
  previous: Totals | null,
): 'none' | 'first' | 'up' | 'strong' | 'steady' {
  if (current.workouts === 0) return 'none';
  if (!previous || previous.workouts === 0) return 'first';
  if (current.workouts > previous.workouts || current.seconds > previous.seconds * 1.1) return 'up';
  if (current.completion >= 90) return 'strong';
  return 'steady';
}

/** The day's encouragement (feedback.day.<key>): a rest day, a record, better than last time… */
export function dayFeedbackKey(
  t: Totals,
  improved: number,
  records: number,
): 'rest' | 'record' | 'better' | 'strong' | 'done' {
  if (t.workouts === 0) return 'rest';
  if (records > 0) return 'record';
  if (improved > 0) return 'better';
  if (t.completion >= 90) return 'strong';
  return 'done';
}

/** { hours, minutes } of a number of seconds, for "3 h 25 min". */
export function hoursMinutes(seconds: number): { hours: number; minutes: number } {
  const total = Math.round(seconds / 60);
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

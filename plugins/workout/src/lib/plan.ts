// The workout plan (ADR 0018): routines placed at a time of day, every day or on a weekday.
// Pure, so the server (overlap check before saving) and the page share it, and it is tested.
//
// Times are wall-clock minutes of the day in the person's own time zone (07:30 = 450), not
// timestamps: "Monday at 07:30" stays 07:30 when the clocks change or the person travels.

/** 1 = Monday … 7 = Sunday (ISO). */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const DAY_MINUTES = 24 * 60;
export const MIN_DURATION = 5;
export const MAX_DURATION = 300;
export const MAX_PLAN_ENTRIES = 100;

export interface PlanSlot {
  id?: number;
  routineId: number;
  /** null = every day. */
  weekday: Weekday | null;
  /** Minutes after midnight. */
  start: number;
  /** Minutes; the slot ends at start + duration, at midnight at the latest. */
  duration: number;
}

export function isWeekday(value: unknown): value is Weekday {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 7;
}

/** The weekdays a slot happens on. */
export function slotDays(slot: Pick<PlanSlot, 'weekday'>): Weekday[] {
  return slot.weekday === null ? [...WEEKDAYS] : [slot.weekday];
}

export function slotEnd(slot: Pick<PlanSlot, 'start' | 'duration'>): number {
  return slot.start + slot.duration;
}

/** Two slots overlap when they share a day and their times intersect (touching is fine). */
export function overlaps(a: PlanSlot, b: PlanSlot): boolean {
  const days = new Set(slotDays(a));
  if (!slotDays(b).some((d) => days.has(d))) return false;
  return a.start < slotEnd(b) && b.start < slotEnd(a);
}

/** The first existing slot that `candidate` would overlap (ignoring the slot being edited). */
export function findOverlap(
  slots: readonly PlanSlot[],
  candidate: PlanSlot,
  ignoreId?: number,
): PlanSlot | null {
  return (
    slots.find((s) => (ignoreId === undefined || s.id !== ignoreId) && overlaps(s, candidate)) ??
    null
  );
}

/** What is planned on a weekday (every-day slots included), earliest first. */
export function slotsForDay<T extends PlanSlot>(slots: readonly T[], weekday: Weekday): T[] {
  return slots
    .filter((s) => s.weekday === null || s.weekday === weekday)
    .sort((a, b) => a.start - b.start);
}

/** "07:30" → 450; null when not a valid time. */
export function parseTime(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** 450 → "07:30" (1440 → "24:00", the end of a slot that lasts until midnight). */
export function formatTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** The weekday of `date` in a time zone (1 = Monday). */
export function weekdayIn(date: Date, timeZone: string): Weekday {
  const name = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone }).format(date);
  return (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(name) + 1) as Weekday;
}

/** A slot's default length: the routine's estimated minutes, rounded up to 5. */
export function defaultDuration(estimatedSeconds: number): number {
  const minutes = Math.ceil(estimatedSeconds / 60 / 5) * 5;
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, minutes));
}

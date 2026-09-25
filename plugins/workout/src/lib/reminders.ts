// Reminders for planned workouts (ADR 0019). Pure and tested: which reminders are due now, and
// the plan as a calendar file (.ics) so the phone's own calendar can remind too.

import { DAY_MINUTES, formatTime, type PlanSlot, type Weekday } from './plan';

/** Offered choices: minutes before the start (0 = at the start); null = no reminder. */
export const REMIND_CHOICES = [0, 10, 30, 60] as const;

export function isRemindMinutes(value: unknown): value is (typeof REMIND_CHOICES)[number] {
  return (REMIND_CHOICES as readonly unknown[]).includes(value);
}

/** Now as the person sees it: their calendar day, weekday and minute of the day. */
export interface LocalNow {
  /** YYYY-MM-DD in their time zone. */
  date: string;
  weekday: Weekday;
  minute: number;
}

export function localNow(now: Date, timeZone: string): LocalNow {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.weekday!) +
      1) as Weekday,
    minute: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** The calendar day after YYYY-MM-DD. */
export function nextDate(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export interface ReminderSlot extends PlanSlot {
  id: number;
  remindMinutes: number | null;
}

export interface DueReminder {
  entryId: number;
  /** The day of the workout (YYYY-MM-DD, their time zone): one reminder per slot and day. */
  day: string;
  start: number;
}

const happensOn = (slot: PlanSlot, weekday: Weekday) =>
  slot.weekday === null || slot.weekday === weekday;

/**
 * Reminders to send now: the reminder time has come and the workout has not started yet. A
 * reminder may fall on the evening before (a 06:00 workout with a 60-minute reminder at 05:00 is
 * the same day; 00:30 with 60 minutes is 23:30 the day before).
 */
export function dueReminders(slots: readonly ReminderSlot[], now: LocalNow): DueReminder[] {
  const tomorrow = ((now.weekday % 7) + 1) as Weekday;
  const due: DueReminder[] = [];
  for (const slot of slots) {
    if (slot.remindMinutes === null) continue;
    const at = slot.start - slot.remindMinutes;
    // Today's workout.
    if (happensOn(slot, now.weekday) && now.minute >= at && now.minute < slot.start) {
      due.push({ entryId: slot.id, day: now.date, start: slot.start });
    }
    // Tomorrow's workout, reminded before midnight.
    if (at < 0 && happensOn(slot, tomorrow) && now.minute >= DAY_MINUTES + at) {
      due.push({ entryId: slot.id, day: nextDate(now.date), start: slot.start });
    }
  }
  return due;
}

// ---- Calendar file ------------------------------------------------------------------------------

const ICS_DAYS: Record<Weekday, string> = {
  1: 'MO',
  2: 'TU',
  3: 'WE',
  4: 'TH',
  5: 'FR',
  6: 'SA',
  7: 'SU',
};

/** Text for an iCalendar property: escaped and folded at 75 octets (RFC 5545). */
function icsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = '';
  for (const ch of line) {
    const next = current + ch;
    if (new TextEncoder().encode(next).length > (out.length ? 74 : 75)) {
      out.push(current);
      current = ch;
    } else current = next;
  }
  out.push(current);
  return out.join('\r\n ');
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The plan as a calendar: one repeating event per slot (every day, or weekly on its day), in
 * "floating" local time, so 07:30 stays 07:30 wherever the phone is. Slots with a reminder get
 * an alarm. `firstDay` (YYYY-MM-DD, a Monday is fine) is where the repetition starts.
 */
export function planCalendar(args: {
  slots: readonly (ReminderSlot & { title: string })[];
  firstDay: string;
  appUrl: string;
  uidDomain: string;
  now: Date;
  description: string;
  calendarName: string;
}): string {
  const stamp = args.now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
  const base = new Date(`${args.firstDay}T12:00:00Z`);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DevQuake//Workout tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsText(args.calendarName)}`,
  ];
  for (const slot of args.slots) {
    // The first day of the repetition that matches the slot's weekday.
    const first = new Date(base);
    if (slot.weekday !== null) {
      const wd = ((first.getUTCDay() + 6) % 7) + 1;
      first.setUTCDate(first.getUTCDate() + ((slot.weekday - wd + 7) % 7));
    }
    const day = `${first.getUTCFullYear()}${pad(first.getUTCMonth() + 1)}${pad(first.getUTCDate())}`;
    const time = (m: number) => `${pad(Math.floor(m / 60) % 24)}${pad(m % 60)}00`;
    const end = slot.start + slot.duration;
    lines.push(
      'BEGIN:VEVENT',
      `UID:workout-plan-${slot.id}@${args.uidDomain}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${day}T${time(slot.start)}`,
      // A slot ending at midnight ends at 23:59:59 of the same day.
      end >= DAY_MINUTES ? `DTEND:${day}T235959` : `DTEND:${day}T${time(end)}`,
      slot.weekday === null
        ? 'RRULE:FREQ=DAILY'
        : `RRULE:FREQ=WEEKLY;BYDAY=${ICS_DAYS[slot.weekday]}`,
      `SUMMARY:${icsText(slot.title)}`,
      `DESCRIPTION:${icsText(`${args.description} ${formatTime(slot.start)}`)}`,
      `URL:${icsText(args.appUrl)}`,
    );
    if (slot.remindMinutes !== null) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${icsText(slot.title)}`,
        `TRIGGER:-PT${slot.remindMinutes}M`,
        'END:VALARM',
      );
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

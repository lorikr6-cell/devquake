import { describe, expect, it } from 'vitest';
import {
  calendarPlatform,
  dueReminders,
  googleCalendarUrl,
  localNow,
  nextDate,
  planCalendar,
  type ReminderSlot,
} from './reminders';

const slot = (p: Partial<ReminderSlot>): ReminderSlot => ({
  id: 1,
  routineId: 1,
  weekday: 1,
  start: 7 * 60,
  duration: 45,
  remindMinutes: 30,
  ...p,
});

describe('localNow', () => {
  it('gives the day, weekday and minute in the person’s time zone', () => {
    const now = localNow(new Date('2026-09-27T22:15:00Z'), 'Europe/Bucharest');
    expect(now).toEqual({ date: '2026-09-28', weekday: 1, minute: 75 });
    expect(nextDate('2026-12-31')).toBe('2027-01-01');
  });
});

describe('dueReminders', () => {
  const monday = { date: '2026-09-28', weekday: 1 as const };

  it('is due from the reminder time until the start', () => {
    expect(dueReminders([slot({})], { ...monday, minute: 6 * 60 + 29 })).toEqual([]);
    expect(dueReminders([slot({})], { ...monday, minute: 6 * 60 + 30 })).toEqual([
      { entryId: 1, day: '2026-09-28', start: 420 },
    ]);
    expect(dueReminders([slot({})], { ...monday, minute: 7 * 60 })).toEqual([]);
  });

  it('skips slots without reminders and on other days', () => {
    expect(dueReminders([slot({ remindMinutes: null })], { ...monday, minute: 400 })).toEqual([]);
    expect(dueReminders([slot({ weekday: 2 })], { ...monday, minute: 400 })).toEqual([]);
    expect(dueReminders([slot({ weekday: null })], { ...monday, minute: 400 })).toHaveLength(1);
  });

  it('reminds the evening before for workouts just after midnight', () => {
    const early = slot({ weekday: 2, start: 20, remindMinutes: 60 });
    expect(dueReminders([early], { ...monday, minute: 23 * 60 + 25 })).toEqual([
      { entryId: 1, day: '2026-09-29', start: 20 },
    ]);
    expect(dueReminders([early], { ...monday, minute: 23 * 60 })).toEqual([]);
  });
});

describe('planCalendar', () => {
  it('writes repeating events with alarms', () => {
    const ics = planCalendar({
      slots: [
        { ...slot({ id: 7, weekday: 3 }), title: 'Legs, day' },
        { ...slot({ id: 8, weekday: null, start: 18 * 60, remindMinutes: null }), title: 'Walk' },
      ],
      firstDay: '2026-09-28',
      appUrl: 'https://workout.devquake.com',
      uidDomain: 'workout.devquake.com',
      now: new Date('2026-09-26T10:00:00Z'),
      description: 'Planned workout at',
      calendarName: 'My workouts',
    });
    expect(ics).toContain('DTSTART:20260930T070000');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=WE');
    expect(ics).toContain('SUMMARY:Legs\\, day');
    expect(ics).toContain('TRIGGER:-PT30M');
    expect(ics).toContain('RRULE:FREQ=DAILY');
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(1);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });
});

describe('calendars per device', () => {
  it('tells Apple, Android and computers apart', () => {
    expect(
      calendarPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1'),
    ).toBe('apple');
    expect(
      calendarPlatform(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/18.0 Safari/605.1.15',
      ),
    ).toBe('apple');
    expect(
      calendarPlatform('Mozilla/5.0 (Linux; Android 14) Chrome/128.0 Mobile Safari/537.36'),
    ).toBe('android');
    expect(
      calendarPlatform(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/128.0 Safari/537.36',
      ),
    ).toBe('desktop');
    expect(
      calendarPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0 Safari/537.36'),
    ).toBe('desktop');
  });

  it('links to Google Calendar with the repetition', () => {
    const url = new URL(
      googleCalendarUrl({
        slot: { routineId: 1, weekday: 3, start: 7 * 60, duration: 45 },
        title: 'Legs',
        details: 'Planned workout',
        firstDay: '2026-09-28',
      }),
    );
    expect(url.host).toBe('calendar.google.com');
    expect(url.searchParams.get('dates')).toBe('20260930T070000/20260930T074500');
    expect(url.searchParams.get('recur')).toBe('RRULE:FREQ=WEEKLY;BYDAY=WE');
    expect(url.searchParams.get('text')).toBe('Legs');
  });
});

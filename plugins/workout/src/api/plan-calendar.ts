import { api } from '../lib/api';
import { translator } from '../i18n';
import { listPlan } from '../lib/own-routines';
import { planCalendar } from '../lib/reminders';

// GET /api/plan.ics: the plan as a calendar file (ADR 0019). Imported into the phone's calendar,
// every planned workout repeats there, with an alarm when it has a reminder.
export const GET = api(async ({ db, user, locale, baseUrl }) => {
  const t = translator(locale);
  const plan = await listPlan(db, user.id);
  const today = new Date().toISOString().slice(0, 10);
  const ics = planCalendar({
    slots: plan.map((e) => ({
      ...e,
      title: e.routineName ?? t(`templates.${e.template ?? 'custom'}`),
    })),
    firstDay: today,
    appUrl: baseUrl,
    uidDomain: new URL(baseUrl).host,
    now: new Date(),
    description: t('plan.calendarDescription'),
    calendarName: t('plan.calendarName'),
  });
  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="workout-plan.ics"',
      'Cache-Control': 'no-store',
    },
  });
});

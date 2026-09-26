import type { PluginPlatformModule } from '@devquake/plugin-sdk';
import { monthlyEmail, reportMonth } from './lib/monthly-email';
import { claimReminder, forgetOldReminders, reminderEntries } from './lib/own-routines';
import { reminderEmail } from './lib/reminder-email';
import { dueReminders, localNow } from './lib/reminders';
import {
  claimMonthlyReport,
  dueForMonthlyEmail,
  listPhotos,
  markMonthlyReport,
  workoutStats,
} from './lib/progress';

/**
 * Hooks the platform calls (ADR 0007, ADR 0014): dashboard numbers, removing a person's data,
 * and the monthly summary emails.
 */

/** Emails per scheduled run (the host runs it at most once an hour). */
const EMAILS_PER_RUN = 25;

export const getStats: PluginPlatformModule['getStats'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{
    profiles: number;
    routines: number;
    workouts: number;
    active: number;
    exercises: number;
  }>(
    `SELECT (SELECT COUNT(*) FROM profiles) AS profiles,
            (SELECT COUNT(*) FROM routines WHERE archived_at IS NULL) AS routines,
            (SELECT COUNT(*) FROM sessions WHERE status = 'finished') AS workouts,
            (SELECT COUNT(*) FROM sessions WHERE status = 'active') AS active,
            (SELECT COUNT(*) FROM exercises WHERE user_id IS NULL AND retired_at IS NULL) AS exercises`,
  );
  return [
    { label: 'People with a profile', value: Number(row?.profiles ?? 0) },
    { label: 'Routines', value: Number(row?.routines ?? 0) },
    { label: 'Finished workouts', value: Number(row?.workouts ?? 0) },
    { label: 'Workouts in progress', value: Number(row?.active ?? 0) },
    { label: 'Built-in exercises', value: Number(row?.exercises ?? 0) },
  ];
};

/**
 * Deletes everything the app keeps about a person: photos, sent-email log, profile, places,
 * equipment, own and suggested routines, the plan, and workouts (their items and sets go with them through ON DELETE CASCADE), and exercises they
 * added. Runs on account deletion and on unsubscribing.
 */
export const deleteUserData: PluginPlatformModule['deleteUserData'] = async (userId, { db }) => {
  if (!db) {
    // Without its database the app cannot clean up; refusing keeps nothing behind.
    if (process.env.WORKOUT_DB_NAME) throw new Error('workout database unavailable');
    return;
  }
  await db.transaction(async (tx) => {
    await tx.execute('DELETE FROM progress_photos WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM monthly_reports WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM plan_reminders WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM plan_entries WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM sessions WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM routines WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM user_equipment WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM user_locations WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM profiles WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM exercises WHERE user_id = ?', [userId]);
  });
};

/**
 * The monthly summary email (ADR 0015): after the month has ended everywhere (12:00 UTC on the
 * 1st), everyone with the email turned on gets last month's numbers and a link to that month's
 * calendar. A report row is written before sending, so nobody gets it twice.
 */
export const scheduled: PluginPlatformModule['scheduled'] = async (ctx) => {
  if (!ctx.db) return;
  await sendReminders(ctx);
  await sendMonthlyEmails(ctx);
  // Coach voice clips nobody heard for half a year.
  const { pruneVoiceClips } = await import('./lib/tts-server');
  await pruneVoiceClips(ctx.db);
};

/** Reminders sent per run; the host runs this every few minutes. */
const REMINDERS_PER_RUN = 100;

/**
 * Plan reminders (ADR 0019): for every slot with a reminder, in the person's own time zone, an
 * email between the reminder time and the start. A row in plan_reminders is written before
 * sending, so each workout is reminded once even if several server processes run this.
 */
async function sendReminders({
  db,
  mail,
  now,
  baseUrl,
}: Parameters<NonNullable<PluginPlatformModule['scheduled']>>[0]) {
  if (!db) return;
  const entries = await reminderEntries(db);
  let sent = 0;
  const byZone = new Map<string, ReturnType<typeof localNow>>();
  for (const entry of entries) {
    if (sent >= REMINDERS_PER_RUN) break;
    let local = byZone.get(entry.timeZone);
    if (!local) {
      try {
        local = localNow(now, entry.timeZone);
      } catch {
        continue; // an unknown time zone: skip until the next visit fixes it
      }
      byZone.set(entry.timeZone, local);
    }
    for (const due of dueReminders([entry], local)) {
      if (!(await claimReminder(db, entry.id, entry.userId, due.day))) continue;
      await mail.sendToUser(entry.userId, (locale) =>
        reminderEmail({
          locale,
          baseUrl,
          name: entry.routineName,
          template: entry.template,
          start: entry.start,
          duration: entry.duration,
          routineId: entry.routineId,
        }),
      );
      sent += 1;
    }
  }
  await forgetOldReminders(db);
}

async function sendMonthlyEmails({
  db,
  mail,
  now,
  baseUrl,
}: Parameters<NonNullable<PluginPlatformModule['scheduled']>>[0]) {
  if (!db) return;
  const period = reportMonth(now);
  if (!period) return;
  const due = await dueForMonthlyEmail(db, period.month, period.to, EMAILS_PER_RUN);
  for (const userId of due) {
    if (!(await claimMonthlyReport(db, userId, period.month))) continue;
    const [workouts, previous, photos] = await Promise.all([
      workoutStats(db, userId, period.from, period.to),
      workoutStats(db, userId, period.previousFrom, period.from),
      listPhotos(db, userId),
    ]);
    const hasMonthPhoto = photos.some(
      (p) => p.kind === 'month' && p.period.startsWith(period.month),
    );
    const sent = await mail.sendToUser(userId, (locale) =>
      monthlyEmail({ locale, month: period.month, baseUrl, workouts, previous, hasMonthPhoto }),
    );
    await markMonthlyReport(db, userId, period.month, sent);
  }
}

import type { PluginPlatformModule } from '@devquake/plugin-sdk';
import { monthlyEmail, reportMonth } from './lib/monthly-email';
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
 * equipment, routines and workouts (their items and sets go with them through ON DELETE CASCADE), and exercises they
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
export const scheduled: PluginPlatformModule['scheduled'] = async ({ db, mail, now, baseUrl }) => {
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
};

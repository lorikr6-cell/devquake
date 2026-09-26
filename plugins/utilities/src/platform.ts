import type { PluginPlatformModule } from '@devquake/plugin-sdk';

/** Hooks the platform calls (ADR 0007): dashboard numbers and removing a user's data. */

export const getStats: PluginPlatformModule['getStats'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{
    utilities: number;
    users: number;
    bills: number;
    files: number;
    readings: number;
    photos: number;
  }>(
    `SELECT (SELECT COUNT(*) FROM utilities) AS utilities,
            (SELECT COUNT(DISTINCT user_id) FROM utility_members) AS users,
            (SELECT COUNT(*) FROM bills) AS bills,
            (SELECT COUNT(*) FROM bill_files) AS files,
            (SELECT COUNT(*) FROM readings) AS readings,
            (SELECT COUNT(*) FROM reading_photos) AS photos`,
  );
  return [
    { label: 'Utilities', value: Number(row?.utilities ?? 0) },
    { label: 'People sharing utilities', value: Number(row?.users ?? 0) },
    { label: 'Bills', value: Number(row?.bills ?? 0) },
    { label: 'Bill PDFs', value: Number(row?.files ?? 0) },
    { label: 'Meter readings', value: Number(row?.readings ?? 0) },
    { label: 'Meter photos', value: Number(row?.photos ?? 0) },
  ];
};

/**
 * Removes everything this app stores about a user: on account deletion and when they
 * unsubscribe from the app. Utilities they own are deleted with all their bills, PDFs,
 * readings, meter photos, payments and comments (the database cascades from utilities and
 * bills). On other people's utilities their membership, readings, meter photos, payments,
 * comments and bill shares are removed, as are their profile (name and address) and the invite
 * codes they created.
 */
export const deleteUserData: PluginPlatformModule['deleteUserData'] = async (userId, { db }) => {
  if (!db) {
    // Without its database the app cannot clean up; refusing keeps nothing behind.
    if (process.env.UTILITIES_DB_NAME) throw new Error('utilities database unavailable');
    return;
  }
  await db.transaction(async (tx) => {
    await tx.execute('DELETE FROM utilities WHERE owner_user_id = ?', [userId]);
    await tx.execute('DELETE FROM reading_photos WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM readings WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM payments WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM bill_comments WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM bill_participants WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM utility_members WHERE user_id = ?', [userId]);
    await tx.execute('UPDATE utility_invites SET created_by = NULL WHERE created_by = ?', [userId]);
    await tx.execute('UPDATE bills SET created_by = NULL WHERE created_by = ?', [userId]);
    await tx.execute('UPDATE bill_files SET uploaded_by = NULL WHERE uploaded_by = ?', [userId]);
    await tx.execute('UPDATE readings SET entered_by = NULL WHERE entered_by = ?', [userId]);
    await tx.execute('DELETE FROM profiles WHERE user_id = ?', [userId]);
  });
};

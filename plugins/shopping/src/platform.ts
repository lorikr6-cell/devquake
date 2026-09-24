import type { PluginPlatformModule } from '@devquake/plugin-sdk';

/** Hooks the platform calls (ADR 0007): dashboard numbers and account deletion. */

export const getStats: PluginPlatformModule['getStats'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{ lists: number; users: number; items: number; stores: number }>(
    `SELECT (SELECT COUNT(*) FROM lists) AS lists,
              (SELECT COUNT(DISTINCT user_id) FROM list_members) AS users,
              (SELECT COUNT(*) FROM items) AS items,
              (SELECT COUNT(*) FROM stores) AS stores`,
  );
  return [
    { label: 'Lists', value: Number(row?.lists ?? 0) },
    { label: 'People on lists', value: Number(row?.users ?? 0) },
    { label: 'Items', value: Number(row?.items ?? 0) },
    { label: 'Stores', value: Number(row?.stores ?? 0) },
  ];
};

/**
 * A deleted user's lists go to the longest-standing other member (or are deleted when nobody
 * else is on them); their memberships are removed and their name is taken off items.
 */
export const deleteUserData: PluginPlatformModule['deleteUserData'] = async (userId, { db }) => {
  if (!db) {
    // Without its database the app cannot clean up; refusing keeps nothing behind.
    if (process.env.SHOPPING_DB_NAME) throw new Error('shopping database unavailable');
    return;
  }
  await db.transaction(async (tx) => {
    const owned = await tx.query<{ id: number }>('SELECT id FROM lists WHERE owner_user_id = ?', [
      userId,
    ]);
    for (const { id } of owned) {
      const [heir] = await tx.query<{ user_id: number }>(
        `SELECT user_id FROM list_members WHERE list_id = ? AND user_id <> ?
            ORDER BY joined_at, user_id LIMIT 1`,
        [id, userId],
      );
      if (!heir) {
        await tx.execute('DELETE FROM lists WHERE id = ?', [id]);
        continue;
      }
      await tx.execute('UPDATE lists SET owner_user_id = ?, version = version + 1 WHERE id = ?', [
        heir.user_id,
        id,
      ]);
      await tx.execute("UPDATE list_members SET role = 'owner' WHERE list_id = ? AND user_id = ?", [
        id,
        heir.user_id,
      ]);
    }
    await tx.execute('DELETE FROM list_members WHERE user_id = ?', [userId]);
    await tx.execute('UPDATE items SET added_by = NULL, added_by_name = NULL WHERE added_by = ?', [
      userId,
    ]);
    await tx.execute('UPDATE items SET done_by = NULL, done_by_name = NULL WHERE done_by = ?', [
      userId,
    ]);
    await tx.execute('UPDATE list_invites SET created_by = NULL WHERE created_by = ?', [userId]);
    await tx.execute('UPDATE item_photos SET uploaded_by = NULL WHERE uploaded_by = ?', [userId]);
    await tx.execute(
      'UPDATE items SET dropped_by = NULL, dropped_by_name = NULL WHERE dropped_by = ?',
      [userId],
    );
    await tx.execute('UPDATE list_events SET user_id = NULL, user_name = NULL WHERE user_id = ?', [
      userId,
    ]);
  });
};

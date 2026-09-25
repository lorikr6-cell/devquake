import type { PluginPlatformModule } from '@devquake/plugin-sdk';

/** Hooks the platform calls (ADR 0007): dashboard numbers and account deletion. */

export const getStats: PluginPlatformModule['getStats'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{
    lists: number;
    deleted: number;
    users: number;
    items: number;
    stores: number;
  }>(
    `SELECT (SELECT COUNT(*) FROM lists WHERE deleted_at IS NULL) AS lists,
              (SELECT COUNT(*) FROM lists WHERE deleted_at IS NOT NULL) AS deleted,
              (SELECT COUNT(DISTINCT user_id) FROM list_members) AS users,
              (SELECT COUNT(*) FROM items i JOIN lists l ON l.id = i.list_id
                WHERE l.deleted_at IS NULL) AS items,
              (SELECT COUNT(*) FROM stores s JOIN lists l ON l.id = s.list_id
                WHERE l.deleted_at IS NULL) AS stores`,
  );
  return [
    { label: 'Lists', value: Number(row?.lists ?? 0) },
    { label: 'Deleted lists (kept for statistics)', value: Number(row?.deleted ?? 0) },
    { label: 'People on lists', value: Number(row?.users ?? 0) },
    { label: 'Items', value: Number(row?.items ?? 0) },
    { label: 'Stores', value: Number(row?.stores ?? 0) },
  ];
};

/**
 * A deleted user's lists go to the longest-standing other member (or are deleted when nobody
 * else is on them); their memberships are removed and their name is taken off items. Deleted
 * lists (kept for statistics) lose this user too, and go for good once nobody is left on them.
 */
export const deleteUserData: PluginPlatformModule['deleteUserData'] = async (userId, { db }) => {
  if (!db) {
    // Without its database the app cannot clean up; refusing keeps nothing behind.
    if (process.env.SHOPPING_DB_NAME) throw new Error('shopping database unavailable');
    return;
  }
  await db.transaction(async (tx) => {
    const owned = await tx.query<{ id: number }>(
      'SELECT id FROM lists WHERE owner_user_id = ? AND deleted_at IS NULL',
      [userId],
    );
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
    // Deleted lists: hand the (now only nominal) ownership on, drop the user from them, and
    // remove the ones nobody is left on.
    await tx.execute(
      `UPDATE lists l SET owner_user_id = COALESCE(
          (SELECT h.user_id FROM deleted_list_members h WHERE h.list_id = l.id AND h.user_id <> ?
            ORDER BY h.joined_at, h.user_id LIMIT 1), l.owner_user_id)
        WHERE l.owner_user_id = ? AND l.deleted_at IS NOT NULL`,
      [userId, userId],
    );
    await tx.execute('DELETE FROM deleted_list_members WHERE user_id = ?', [userId]);
    await tx.execute(
      `DELETE FROM lists WHERE deleted_at IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM deleted_list_members h WHERE h.list_id = lists.id)`,
    );
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

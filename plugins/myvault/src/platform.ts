import type { PluginPlatformModule } from '@devquake/plugin-sdk';

/** Hooks the platform calls (ADR 0007, 0014, 0022). */

export const getStats: PluginPlatformModule['getStats'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{
    entries: number;
    owners: number;
    withRecipients: number;
    released: number;
    locked: number;
  }>(
    `SELECT (SELECT COUNT(*) FROM entries) AS entries,
            (SELECT COUNT(DISTINCT owner_user_id) FROM entries) AS owners,
            (SELECT COUNT(*) FROM entries WHERE sealed_key IS NOT NULL) AS withRecipients,
            (SELECT COUNT(*) FROM entries WHERE released_at IS NOT NULL) AS released,
            (SELECT COUNT(*) FROM entries WHERE locked_until > UTC_TIMESTAMP()) AS locked`,
  );
  return [
    { label: 'Vault entries', value: Number(row?.entries ?? 0) },
    { label: 'People with entries', value: Number(row?.owners ?? 0) },
    { label: 'Entries with recipients', value: Number(row?.withRecipients ?? 0) },
    { label: 'Released entries', value: Number(row?.released ?? 0) },
    { label: 'Locked right now', value: Number(row?.locked ?? 0) },
  ];
};

/**
 * Removes everything the vault keeps about a person, on account deletion and on unsubscribing:
 * their entries (content, questions, recipients and tries go with them), the entries of others
 * they were a recipient of lose them, their own tries on others' entries, and their activity.
 */
export const deleteUserData: PluginPlatformModule['deleteUserData'] = async (userId, { db }) => {
  if (!db) {
    if (process.env.MYVAULT_DB_NAME) throw new Error('myvault database unavailable');
    return;
  }
  await db.transaction(async (tx) => {
    await tx.execute('DELETE FROM entries WHERE owner_user_id = ?', [userId]);
    await tx.execute('DELETE FROM entry_recipients WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM attempts WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM activity WHERE user_id = ?', [userId]);
  });
};

/** Entries looked at per run (the host runs this every few minutes). */
const PER_RUN = 200;

/**
 * The release (ADR 0022): for every entry with recipients, the owner's last activity anywhere
 * on DevQuake (or, on older hosts, in the vault) decides. In the last days the owner gets a
 * warning (once per period of inactivity); then the entry is marked released and every
 * recipient gets the vault key and a link to open it.
 */
export const scheduled: PluginPlatformModule['scheduled'] = async (ctx) => {
  const { db, mail, baseUrl, now } = ctx;
  if (!db) return;
  const [
    { pendingReleases, markWarned, releaseEntry, markNotified, takeLockNotices },
    { releaseState },
    emails,
  ] = await Promise.all([import('./lib/data'), import('./lib/model'), import('./lib/emails')]);
  const { masterKey } = await import('./lib/server-crypto');
  if (!masterKey()) return;

  // Owners of entries that just got locked (3 wrong tries) learn about it.
  for (const notice of await takeLockNotices(db, 50)) {
    await mail.sendToUser(notice.ownerId, (locale) =>
      emails.lockEmail({ entryId: notice.id, title: notice.title }, locale, baseUrl),
    );
  }

  const pending = await pendingReleases(db, PER_RUN);
  if (pending.length === 0) return;
  const platformActivity = ctx.lastActiveAt
    ? await ctx.lastActiveAt([...new Set(pending.map((p) => p.ownerId))])
    : {};
  for (const entry of pending) {
    // The later of DevQuake-wide activity and use of the vault itself.
    const candidates = [platformActivity[entry.ownerId] ?? null, entry.appLastSeen].filter(
      (v): v is string => v !== null,
    );
    const lastActive = candidates.length
      ? new Date(Math.max(...candidates.map((v) => Date.parse(v)))).toISOString()
      : null;
    const state = releaseState({
      hasRecipients: true,
      inactiveDays: entry.inactiveDays,
      notBefore: entry.notBefore,
      ruleSetAt: entry.ruleSetAt,
      lastActiveAt: lastActive,
      now,
    });
    if (state.kind === 'warn') {
      if (await markWarned(db, entry.id, lastActive)) {
        await mail.sendToUser(entry.ownerId, (locale) =>
          emails.warningEmail({ title: entry.title, daysLeft: state.daysLeft }, locale, baseUrl),
        );
      }
      continue;
    }
    if (state.kind !== 'release') continue;
    const released = await releaseEntry(db, entry.id);
    if (!released) continue;
    for (const recipient of released.recipients) {
      const sent = await mail.sendToUser(
        recipient.userId,
        (locale) =>
          emails.releaseEmail(
            {
              entryId: entry.id,
              title: entry.title,
              ownerName: entry.ownerName,
              key: released.key,
            },
            locale,
            baseUrl,
          ),
        { withoutAccess: true },
      );
      if (sent) await markNotified(db, entry.id, recipient.userId);
    }
  }
};

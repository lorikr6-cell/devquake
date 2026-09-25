import 'server-only';
import { logActivity } from './activity';
import { ADMIN_BASE } from './auth/admin';
import { ROLE_ADMIN, ROLE_OWNER, type SessionUser } from './auth/session';
import { getPool, query, type Row } from './db';
import { hostUrl } from './domain';
import { sendMail } from './mail/mailer';
import { accountChangedEmail, accountDeletedEmail } from './mail/templates';
import { deleteUserDataInPlugins } from './plugin-platform';

/**
 * Self-service account deletion (GDPR "right to erasure"). Deletes the user and every piece of
 * personal data we hold about them, in one transaction:
 *  - via foreign keys (ON DELETE CASCADE): roles, sessions, project assignments, subscriptions,
 *    sign-in codes, activation links, invites they sent, avatar, their community ideas (with
 *    pictures, votes and comments on them) and their votes and comments on other ideas;
 *  - explicitly (no foreign key): sign-in snapshots, login attempts, activity log entries about
 *    them, the email log, contact messages, and their address in other members' invite lists
 *    (the inviter keeps the NPS point but no longer sees who it was).
 * Content others created stays but loses the link (ON DELETE SET NULL). To come back, the person
 * creates a new account.
 */
export type DeleteResult = { ok: true } | { ok: false; error: 'owner' | 'plugins' };

/** The account to delete (the signed-in user, or a user chosen by the owner). */
export interface DeletionTarget {
  userId: number;
  email: string;
  displayName: string;
  roles: string[];
}

/**
 * Who keeps DevQuake running when an owner deletes their own account: another active owner, or
 * else the longest-standing active admin, who is promoted to owner. With neither, an owner
 * cannot delete their account (the site would have nobody to manage it).
 */
export type OwnerSuccession =
  | { kind: 'not-owner' }
  | { kind: 'other-owner' }
  | { kind: 'promote'; userId: number; displayName: string; email: string }
  | { kind: 'none' };

export async function ownerSuccession(userId: number): Promise<OwnerSuccession> {
  const withRole = (code: string) =>
    query<Row & { id: number; display_name: string; email: string }>(
      `SELECT u.id, u.display_name, u.email
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id AND r.code = ?
        WHERE u.id <> ? AND u.status = 'active'
        ORDER BY ur.granted_at, u.id`,
      [code, userId],
    );
  const [mine] = await query<Row & { n: number }>(
    `SELECT COUNT(*) AS n FROM user_roles ur JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = ? AND r.code = ?`,
    [userId, ROLE_OWNER],
  );
  if (!Number(mine?.n)) return { kind: 'not-owner' };
  if ((await withRole(ROLE_OWNER)).length > 0) return { kind: 'other-owner' };
  const [admin] = await withRole(ROLE_ADMIN);
  if (!admin) return { kind: 'none' };
  return { kind: 'promote', userId: admin.id, displayName: admin.display_name, email: admin.email };
}

/** Self-service deletion from "Your account". */
export function deleteAccount(user: SessionUser): Promise<DeleteResult> {
  return deleteUserAccount(user, null);
}

/**
 * Deletes an account and all personal data (see above). `byOwner` is the owner removing
 * someone else's account (e.g. inactive users); null when users delete their own. The owner
 * account itself is never deleted.
 */
export async function deleteUserAccount(
  target: DeletionTarget,
  byOwner: { userId: number } | null,
): Promise<DeleteResult> {
  // An owner account is never removed by someone else, and an owner may only delete their own
  // account when another owner or an admin can take over (see ownerSuccession).
  let successor: Extract<OwnerSuccession, { kind: 'promote' }> | null = null;
  if (target.roles.includes(ROLE_OWNER)) {
    if (byOwner) return { ok: false, error: 'owner' };
    const succession = await ownerSuccession(target.userId);
    if (succession.kind === 'none') return { ok: false, error: 'owner' };
    if (succession.kind === 'promote') successor = succession;
  }

  const { userId, email, displayName } = target;
  const address = email.toLowerCase();

  // Apps with their own databases remove this user's data first (ADR 0007). If one fails we
  // stop here, so no personal data is left behind in an app database.
  try {
    await deleteUserDataInPlugins(userId);
  } catch (err) {
    console.error('[account] plugin data deletion failed', err);
    return { ok: false, error: 'plugins' };
  }

  // Goodbye email first (the address is gone afterwards), without writing an outbox row.
  await sendMail({
    to: address,
    template: 'account.deleted',
    record: false,
    email: accountDeletedEmail({ siteUrl: hostUrl(), name: displayName, byOwner: !!byOwner }),
  });

  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const q = (sql: string, params: unknown[]) =>
      conn.query<import('mysql2').ResultSetHeader>(sql, params);
    await q('DELETE FROM auth_snapshots WHERE user_id = ? OR email = ?', [userId, address]);
    await q('DELETE FROM login_attempts WHERE email = ?', [address]);
    await q(
      `DELETE FROM activity_log
        WHERE actor_user_id = ?
           OR (entity_type = 'user' AND entity_id = ?)
           OR JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.email')) = ?`,
      [userId, String(userId), address],
    );
    // Other members' log line "invited <address>": keep the event, drop the address.
    await q(
      "UPDATE activity_log SET message = NULL WHERE action = 'referral.invited' AND message = ?",
      [address],
    );
    await q('UPDATE referral_invites SET email = NULL WHERE email = ?', [address]);
    await q('DELETE FROM email_outbox WHERE user_id = ? OR to_email = ?', [userId, address]);
    await q('DELETE FROM contact_messages WHERE user_id = ? OR email = ?', [userId, address]);
    // Picture and sign-in sessions (also removed by the foreign keys; explicit on purpose).
    await q('DELETE FROM user_avatars WHERE user_id = ?', [userId]);
    await q('DELETE FROM sessions WHERE user_id = ?', [userId]);
    if (successor) {
      await q(
        `INSERT IGNORE INTO user_roles (user_id, role_id)
         SELECT ?, id FROM roles WHERE code IN (?, ?)`,
        [successor.userId, ROLE_OWNER, ROLE_ADMIN],
      );
    }
    await q('DELETE FROM users WHERE id = ?', [userId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Anonymous count only, for the owner's statistics.
  await logActivity({
    source: 'host',
    level: 'notice',
    action: 'account.deleted',
    message: byOwner
      ? 'An account was removed by the site owner'
      : 'An account was deleted by its owner',
    actorUserId: byOwner?.userId ?? null,
  });

  if (successor) {
    // Shown in the new owner's account activity and emailed to them.
    const change = 'You are now the owner of DevQuake: the previous owner deleted their account';
    await logActivity({
      source: 'host',
      level: 'security',
      action: 'user.updated',
      message: change,
      entityType: 'user',
      entityId: successor.userId,
    });
    await sendMail({
      to: successor.email,
      userId: successor.userId,
      template: 'account.changed',
      email: accountChangedEmail({
        siteUrl: hostUrl(),
        name: successor.displayName,
        changes: [change],
        isAdmin: true,
        adminUrl: `${hostUrl()}${ADMIN_BASE}`,
        projects: [],
        disabled: false,
      }),
    });
  }
  return { ok: true };
}

export interface RemovalReport {
  removed: number;
  skipped: Array<{ userId: number; reason: 'owner' | 'self' | 'missing' | 'plugins' }>;
}

/**
 * The owner removes accounts from /admin-cp/users (e.g. inactive users). Never the owner
 * account and never the signed-in owner themselves; each account is deleted completely, like a
 * self-service deletion, and emailed.
 */
export async function removeUsersAsOwner(
  owner: SessionUser,
  userIds: number[],
): Promise<RemovalReport> {
  const report: RemovalReport = { removed: 0, skipped: [] };
  for (const userId of [...new Set(userIds)].slice(0, 200)) {
    if (userId === owner.userId) {
      report.skipped.push({ userId, reason: 'self' });
      continue;
    }
    const [rows] = await getPool().query<import('mysql2').RowDataPacket[]>(
      `SELECT u.id, u.email, u.display_name,
              (SELECT GROUP_CONCAT(r.code) FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_id = u.id) AS role_codes
         FROM users u WHERE u.id = ?`,
      [userId],
    );
    const row = rows[0];
    if (!row) {
      report.skipped.push({ userId, reason: 'missing' });
      continue;
    }
    const result = await deleteUserAccount(
      {
        userId,
        email: String(row.email),
        displayName: String(row.display_name),
        roles: row.role_codes ? String(row.role_codes).split(',') : [],
      },
      { userId: owner.userId },
    );
    if (result.ok) report.removed += 1;
    else report.skipped.push({ userId, reason: result.error });
  }
  return report;
}

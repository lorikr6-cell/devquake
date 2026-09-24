import 'server-only';
import { logActivity } from './activity';
import { ROLE_OWNER, type SessionUser } from './auth/session';
import { getPool } from './db';
import { hostUrl } from './domain';
import { sendMail } from './mail/mailer';
import { accountDeletedEmail } from './mail/templates';

/**
 * Self-service account deletion (GDPR "right to erasure"). Deletes the user and every piece of
 * personal data we hold about them, in one transaction:
 *  - via foreign keys (ON DELETE CASCADE): roles, sessions, project assignments, subscriptions,
 *    sign-in codes, activation links, invites they sent, avatar;
 *  - explicitly (no foreign key): sign-in snapshots, login attempts, activity log entries about
 *    them, the email log, contact messages, and their address in other members' invite lists
 *    (the inviter keeps the NPS point but no longer sees who it was).
 * Content others created stays but loses the link (ON DELETE SET NULL). To come back, the person
 * creates a new account.
 */
export type DeleteResult = { ok: true } | { ok: false; error: 'owner' };

export async function deleteAccount(user: SessionUser): Promise<DeleteResult> {
  // The owner must not lock themselves out of the site.
  if (user.roles.includes(ROLE_OWNER)) return { ok: false, error: 'owner' };

  const { userId, email, displayName } = user;
  const address = email.toLowerCase();

  // Goodbye email first (the address is gone afterwards), without writing an outbox row.
  await sendMail({
    to: address,
    template: 'account.deleted',
    record: false,
    email: accountDeletedEmail({ siteUrl: hostUrl(), name: displayName }),
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
    message: 'An account was deleted by its owner',
  });
  return { ok: true };
}

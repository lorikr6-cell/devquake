import 'server-only';
import { logActivity } from '../activity';
import { execute, queryOne, type Row } from '../db';
import { hostUrl } from '../domain';
import { sendMail } from '../mail/mailer';
import { welcomeActivationEmail } from '../mail/templates';
import type { RequestInfo } from '../request';
import { completeReferral } from '../referrals';
import { generateToken, sha256 } from './codes';

/**
 * Account activation by email link (sign-up). The account stays 'pending' until the link is
 * opened. Only SHA-256 of the link token is stored; a link works once and expires after
 * ACTIVATION_TTL_HOURS. Requesting a new link cancels the previous ones.
 */
export const ACTIVATION_TTL_HOURS = 48;
const RESEND_COOLDOWN_SECONDS = 60;

export type SendActivationResult = 'sent' | 'cooldown' | 'failed';

export async function sendActivationEmail(
  user: { id: number; email: string; display_name: string },
  info: RequestInfo,
): Promise<SendActivationResult> {
  const recent = await queryOne<Row & { n: number }>(
    `SELECT COUNT(*) AS n FROM account_activations
      WHERE user_id = ? AND used_at IS NULL
        AND created_at > UTC_TIMESTAMP() - INTERVAL ? SECOND`,
    [user.id, RESEND_COOLDOWN_SECONDS],
  );
  // A link was just sent: do not flood the inbox, the previous email is still valid.
  if (Number(recent?.n ?? 0) > 0) return 'cooldown';

  await execute(
    `UPDATE account_activations SET expires_at = UTC_TIMESTAMP()
      WHERE user_id = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP()`,
    [user.id],
  );
  const token = generateToken();
  await execute(
    `INSERT INTO account_activations (user_id, token_hash, ip, expires_at)
     VALUES (?, ?, ?, UTC_TIMESTAMP() + INTERVAL ? HOUR)`,
    [user.id, sha256(token), info.ip, ACTIVATION_TTL_HOURS],
  );

  const sent = await sendMail({
    to: user.email,
    userId: user.id,
    template: 'account.welcome',
    email: welcomeActivationEmail({
      siteUrl: hostUrl(),
      name: user.display_name,
      activationUrl: `${hostUrl()}/activate?token=${encodeURIComponent(token)}`,
      hours: ACTIVATION_TTL_HOURS,
    }),
  });
  return sent ? 'sent' : 'failed';
}

export type ActivationResult =
  | { ok: true; userId: number; alreadyActive: boolean }
  | { ok: false; reason: 'invalid' | 'expired' };

interface ActivationRow extends Row {
  id: number;
  user_id: number;
  used: number;
  expired: number;
  status: 'active' | 'disabled' | 'pending';
}

/** Opens an activation link. Safe to call twice (e.g. a mail scanner opened it first). */
export async function activateAccount(token: string, info: RequestInfo): Promise<ActivationResult> {
  if (!token || token.length > 100) return { ok: false, reason: 'invalid' };
  const row = await queryOne<ActivationRow>(
    `SELECT a.id, a.user_id, a.used_at IS NOT NULL AS used,
            a.expires_at <= UTC_TIMESTAMP() AS expired, u.status
       FROM account_activations a JOIN users u ON u.id = a.user_id
      WHERE a.token_hash = ?`,
    [sha256(token)],
  );
  if (!row || row.status === 'disabled') return { ok: false, reason: 'invalid' };
  // Opened again after it worked: the account is active, just send them to sign in.
  if (row.used || row.status === 'active') {
    return { ok: true, userId: row.user_id, alreadyActive: true };
  }
  if (row.expired) return { ok: false, reason: 'expired' };

  const used = await execute(
    'UPDATE account_activations SET used_at = UTC_TIMESTAMP() WHERE id = ? AND used_at IS NULL',
    [row.id],
  );
  if (used.affectedRows !== 1) return { ok: true, userId: row.user_id, alreadyActive: true };

  await execute(
    `UPDATE users SET status = 'active', email_verified_at = UTC_TIMESTAMP()
      WHERE id = ? AND status = 'pending'`,
    [row.user_id],
  );
  try {
    await completeReferral(row.user_id);
  } catch (err) {
    console.error('[referrals] could not complete referral', err);
  }
  await logActivity({
    source: 'host',
    level: 'security',
    action: 'auth.signup.activated',
    message: 'Account activated by email link',
    actorUserId: row.user_id,
    ip: info.ip,
    userAgent: info.userAgent,
  });
  return { ok: true, userId: row.user_id, alreadyActive: false };
}

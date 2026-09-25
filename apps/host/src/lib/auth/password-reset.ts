import 'server-only';
import { localizePath, type Locale } from '@devquake/ui';
import { cookies } from 'next/headers';
import { logActivity } from '../activity';
import { execute, queryOne, type Row } from '../db';
import { getProtocol, hostUrl } from '../domain';
import { sendMail } from '../mail/mailer';
import { passwordChangedEmail, passwordResetEmail } from '../mail/templates';
import type { RequestInfo } from '../request';
import { userLocale } from '../user-locale';
import { sendActivationEmail } from './activation';
import { generateToken, sha256 } from './codes';
import { hashPassword } from './password';
import { revokeAllSessions } from './session';
import { MIN_PASSWORD_LENGTH, isEmail } from './signup-rules';

/**
 * "Forgot your password?" (ADR 0017). The member asks for a link by email address; the link
 * lets them choose a new password once, within RESET_TTL_MINUTES. Policy:
 *  - The answer never says whether an account exists for the address (no account discovery).
 *  - Only SHA-256 of the link token is stored; a new link cancels the older ones.
 *  - At most MAX_PER_USER_PER_HOUR emails per account and MAX_PER_IP_PER_HOUR requests per IP.
 *  - Setting the password ends every session of the account, clears a sign-in lock, and emails
 *    a confirmation. Signing in still needs the emailed code afterwards.
 *  - Accounts that are not activated get a fresh activation link instead.
 */
export const RESET_TTL_MINUTES = 60;
/** The link's token waits in this cookie while the member types the new password. */
export const RESET_COOKIE_MAX_AGE = RESET_TTL_MINUTES * 60;

export function resetCookieName(): string {
  return getProtocol() === 'https' ? '__Host-dq_reset' : 'dq_reset';
}

/** The token the /password-reset link stored in this browser, if any. */
export async function resetTokenFromCookie(): Promise<string> {
  const token = (await cookies()).get(resetCookieName())?.value ?? '';
  return token.length <= 100 ? token : '';
}

export async function clearResetCookie(): Promise<void> {
  (await cookies()).delete({ name: resetCookieName(), path: '/' });
}
const MAX_PER_USER_PER_HOUR = 3;
const MAX_PER_IP_PER_HOUR = 10;

export type RequestResetResult = { ok: true } | { ok: false; error: 'invalid' | 'throttled' };

interface ResetUserRow extends Row {
  id: number;
  email: string;
  display_name: string;
  status: 'active' | 'disabled' | 'pending';
}

function security(action: string, message: string, info: RequestInfo, userId: number | null) {
  return logActivity({
    source: 'host',
    level: 'security',
    action,
    message,
    actorUserId: userId,
    ip: info.ip,
    userAgent: info.userAgent,
  });
}

export async function requestPasswordReset(
  rawEmail: string,
  info: RequestInfo,
  locale: Locale,
): Promise<RequestResetResult> {
  const email = rawEmail.trim().toLowerCase().slice(0, 254);
  if (!isEmail(email)) return { ok: false, error: 'invalid' };

  const perIp = await queryOne<Row & { n: number }>(
    `SELECT COUNT(*) AS n FROM activity_log
      WHERE action = 'auth.password.reset_requested' AND ip <=> ?
        AND occurred_at > UTC_TIMESTAMP() - INTERVAL 1 HOUR`,
    [info.ip],
  );
  if (Number(perIp?.n ?? 0) >= MAX_PER_IP_PER_HOUR) return { ok: false, error: 'throttled' };

  const user = await queryOne<ResetUserRow>(
    'SELECT id, email, display_name, status FROM users WHERE email = ?',
    [email],
  );
  // Counted for every request, known address or not, so the IP limit cannot tell them apart.
  await security(
    'auth.password.reset_requested',
    user ? 'Password reset requested' : 'Password reset requested (unknown email)',
    info,
    user?.id ?? null,
  );
  if (!user || user.status === 'disabled') return { ok: true };
  if (user.status === 'pending') {
    await sendActivationEmail(user, info);
    return { ok: true };
  }

  const recent = await queryOne<Row & { n: number }>(
    `SELECT COUNT(*) AS n FROM password_resets
      WHERE user_id = ? AND created_at > UTC_TIMESTAMP() - INTERVAL 1 HOUR`,
    [user.id],
  );
  // Quietly stop emailing: the links already sent still work.
  if (Number(recent?.n ?? 0) >= MAX_PER_USER_PER_HOUR) return { ok: true };

  await execute(
    `UPDATE password_resets SET expires_at = UTC_TIMESTAMP()
      WHERE user_id = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP()`,
    [user.id],
  );
  const token = generateToken();
  await execute(
    `INSERT INTO password_resets (user_id, token_hash, ip, created_at, expires_at)
     VALUES (?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP() + INTERVAL ? MINUTE)`,
    [user.id, sha256(token), info.ip, RESET_TTL_MINUTES],
  );
  // The link opens in the language of the page the request was made on. /password-reset
  // moves the token into a cookie and shows /reset-password without it in the address.
  const resetUrl = `${hostUrl()}${localizePath('/password-reset', locale)}?token=${encodeURIComponent(token)}`;
  await sendMail({
    to: user.email,
    userId: user.id,
    template: 'account.password_reset',
    email: passwordResetEmail({
      siteUrl: hostUrl(),
      name: user.display_name,
      resetUrl,
      minutes: RESET_TTL_MINUTES,
      locale,
    }),
  });
  return { ok: true };
}

interface ResetRow extends Row {
  id: number;
  user_id: number;
  used: number;
  expired: number;
  status: 'active' | 'disabled' | 'pending';
  email: string;
  display_name: string;
}

async function findReset(token: string): Promise<ResetRow | null> {
  if (!token || token.length > 100) return null;
  return queryOne<ResetRow>(
    `SELECT r.id, r.user_id, r.used_at IS NOT NULL AS used,
            r.expires_at <= UTC_TIMESTAMP() AS expired, u.status, u.email, u.display_name
       FROM password_resets r JOIN users u ON u.id = r.user_id
      WHERE r.token_hash = ?`,
    [sha256(token)],
  );
}

export type ResetLinkState = 'valid' | 'expired' | 'invalid';

/** Whether a link from the email can still be used (the page shows the form or says why not). */
export async function resetLinkState(token: string): Promise<ResetLinkState> {
  const row = await findReset(token);
  if (!row || row.status !== 'active' || row.used) return 'invalid';
  return row.expired ? 'expired' : 'valid';
}

export type ResetPasswordResult =
  { ok: true } | { ok: false; error: 'invalid' | 'expired' | 'weak_password' };

export async function resetPassword(
  token: string,
  password: string,
  info: RequestInfo,
): Promise<ResetPasswordResult> {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > 256) {
    return { ok: false, error: 'weak_password' };
  }
  const row = await findReset(token);
  if (!row || row.status !== 'active' || row.used) return { ok: false, error: 'invalid' };
  if (row.expired) return { ok: false, error: 'expired' };

  // Single use: only the request that marks the link used may change the password.
  const used = await execute(
    'UPDATE password_resets SET used_at = UTC_TIMESTAMP() WHERE id = ? AND used_at IS NULL',
    [row.id],
  );
  if (used.affectedRows !== 1) return { ok: false, error: 'invalid' };

  await execute(
    `UPDATE users SET password_hash = ?, failed_login_count = 0, locked_until = NULL
      WHERE id = ?`,
    [await hashPassword(password), row.user_id],
  );
  // Other open links and half-finished sign-ins stop working; every device is signed out.
  await execute(
    `UPDATE password_resets SET expires_at = UTC_TIMESTAMP()
      WHERE user_id = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP()`,
    [row.user_id],
  );
  await execute(
    `UPDATE login_challenges SET consumed_at = UTC_TIMESTAMP()
      WHERE user_id = ? AND consumed_at IS NULL`,
    [row.user_id],
  );
  await revokeAllSessions(row.user_id);
  await security('auth.password.reset', 'Password changed with a reset link', info, row.user_id);
  await sendMail({
    to: row.email,
    userId: row.user_id,
    template: 'account.password_changed',
    email: passwordChangedEmail({
      siteUrl: hostUrl(),
      name: row.display_name,
      locale: await userLocale(row.user_id),
    }),
  });
  return { ok: true };
}

import 'server-only';
import { logActivity } from '../activity';
import { execute, queryOne, type Row } from '../db';
import type { RequestInfo } from '../request';
import { getDummyHash, verifyPassword } from './password';
import { createSession } from './session';

/** Brute-force limits. Failures are counted in a sliding window. */
export const WINDOW_MINUTES = 15;
export const MAX_FAILURES_PER_EMAIL = 5;
export const MAX_FAILURES_PER_IP = 20;
export const LOCKOUT_MINUTES = 15;

export type LoginResult =
  { ok: true; userId: number } | { ok: false; reason: 'invalid' | 'throttled' };

interface CountRow extends Row {
  by_email: number;
  by_ip: number;
}

interface UserRow extends Row {
  id: number;
  password_hash: string;
  status: string;
  locked: number;
  failed_login_count: number;
  is_admin: number;
}

async function recordAttempt(
  email: string,
  info: RequestInfo,
  succeeded: boolean,
  reason: string,
): Promise<void> {
  await execute(
    'INSERT INTO login_attempts (email, ip, user_agent, succeeded, reason) VALUES (?, ?, ?, ?, ?)',
    [email, info.ip, info.userAgent, succeeded ? 1 : 0, reason],
  );
}

/**
 * Verifies admin credentials and starts a session. Every failure returns the same generic
 * result so the form never reveals whether an email exists, is locked or lacks the role.
 */
export async function loginAdmin(
  rawEmail: string,
  password: string,
  info: RequestInfo,
): Promise<LoginResult> {
  const email = rawEmail.trim().toLowerCase().slice(0, 254);
  const log = (action: string, message: string, actorUserId?: number) =>
    logActivity({
      source: 'admin-cp',
      level: 'security',
      action,
      message,
      actorUserId,
      ip: info.ip,
      userAgent: info.userAgent,
      metadata: { email },
    });

  const counts = await queryOne<CountRow>(
    `SELECT
       (SELECT COUNT(*) FROM login_attempts
         WHERE email = ? AND succeeded = 0 AND created_at > UTC_TIMESTAMP() - INTERVAL ? MINUTE) AS by_email,
       (SELECT COUNT(*) FROM login_attempts
         WHERE ip <=> ? AND succeeded = 0 AND created_at > UTC_TIMESTAMP() - INTERVAL ? MINUTE) AS by_ip`,
    [email, WINDOW_MINUTES, info.ip, WINDOW_MINUTES],
  );
  if (
    counts &&
    (counts.by_email >= MAX_FAILURES_PER_EMAIL || counts.by_ip >= MAX_FAILURES_PER_IP)
  ) {
    await recordAttempt(email, info, false, 'throttled');
    await log('auth.login.throttled', 'Login blocked by rate limit');
    return { ok: false, reason: 'throttled' };
  }

  const user = await queryOne<UserRow>(
    `SELECT u.id, u.password_hash, u.status, u.failed_login_count,
            (u.locked_until IS NOT NULL AND u.locked_until > UTC_TIMESTAMP()) AS locked,
            EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                    WHERE ur.user_id = u.id AND r.code = 'platform.admin') AS is_admin
       FROM users u WHERE u.email = ?`,
    [email],
  );

  // Always run scrypt so response time does not reveal whether the email exists.
  const passwordOk = await verifyPassword(password, user?.password_hash ?? (await getDummyHash()));

  let reason: string | null = null;
  if (!user) reason = 'unknown_email';
  else if (!passwordOk) reason = 'bad_password';
  else if (user.status !== 'active') reason = 'inactive';
  else if (user.locked) reason = 'locked';
  else if (!user.is_admin) reason = 'not_admin';

  if (reason || !user) {
    await recordAttempt(email, info, false, reason ?? 'unknown');
    if (user && reason === 'bad_password') {
      const failures = user.failed_login_count + 1;
      const lock = failures >= MAX_FAILURES_PER_EMAIL;
      await execute(
        `UPDATE users SET failed_login_count = ?,
                locked_until = IF(?, UTC_TIMESTAMP() + INTERVAL ? MINUTE, locked_until)
          WHERE id = ?`,
        [failures, lock, LOCKOUT_MINUTES, user.id],
      );
      if (lock) await log('auth.account.locked', `Locked for ${LOCKOUT_MINUTES} minutes`, user.id);
    }
    await log('auth.login.failed', `Login failed (${reason})`, user?.id);
    return { ok: false, reason: 'invalid' };
  }

  await execute(
    `UPDATE users SET failed_login_count = 0, locked_until = NULL,
            last_login_at = UTC_TIMESTAMP(), last_login_ip = ?
      WHERE id = ?`,
    [info.ip, user.id],
  );
  await recordAttempt(email, info, true, 'ok');
  await createSession(user.id, info);
  await log('auth.login.success', 'Signed in to admin control panel', user.id);
  return { ok: true, userId: user.id };
}

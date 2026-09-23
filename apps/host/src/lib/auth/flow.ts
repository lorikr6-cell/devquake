import 'server-only';
import { cookies } from 'next/headers';
import { logActivity } from '../activity';
import { execute, getPool, queryOne, type Row } from '../db';
import { getProtocol, hostUrl } from '../domain';
import { sendMail } from '../mail/mailer';
import { accountLockedEmail, signInCodeEmail, signUpCodeEmail } from '../mail/templates';
import { getRequestInfo, type RequestInfo } from '../request';
import { codeHash, generateCode, generateToken, hashesEqual, normaliseCode, sha256 } from './codes';
import { getDummyHash, hashPassword, verifyPassword } from './password';
import { ROLE_ADMIN, ROLE_OWNER, createSession } from './session';
import { recordSnapshot, type ClientContext } from './snapshot';

/**
 * Sign-in is two steps: (1) email + password, then (2) a one-time code sent by email.
 * Policy:
 *  - 3 consecutive wrong passwords (or 3 attempts on an unknown email) lock that email for
 *    3 hours. The lock is per account, so anyone who knows an email can lock it: the owner
 *    can always unlock with `pnpm admin:create`.
 *  - 20 failed attempts per IP in 15 minutes are throttled (password spraying).
 *  - A code expires after 10 minutes, allows 5 tries, and can be re-sent 3 times (60 s apart).
 */
export const MAX_CONSECUTIVE_FAILURES = 3;
export const LOCK_HOURS = 3;
const IP_WINDOW_MINUTES = 15;
const MAX_FAILURES_PER_IP = 20;
const MAX_SIGNUPS_PER_IP_PER_HOUR = 5;
export const CODE_TTL_MINUTES = 10;
const MAX_CODE_ATTEMPTS = 5;
const MAX_RESENDS = 3;
const RESEND_COOLDOWN_SECONDS = 60;
export const MIN_PASSWORD_LENGTH = 10;

export type AuthContext = 'site' | 'admin-cp';
type Purpose = 'signin' | 'signup' | 'admin';

export type AuthError =
  | 'invalid'
  | 'locked'
  | 'throttled'
  | 'disabled'
  | 'mail'
  | 'exists'
  | 'weak_password'
  | 'bad_input';

export type StartResult = { ok: true } | { ok: false; error: AuthError };

function challengeCookieName(): string {
  return getProtocol() === 'https' ? '__Host-dq_challenge' : 'dq_challenge';
}

const normaliseEmail = (email: string) => email.trim().toLowerCase().slice(0, 254);
export const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

interface UserRow extends Row {
  id: number;
  email: string;
  display_name: string;
  password_hash: string;
  status: 'active' | 'disabled' | 'pending';
  failed_login_count: number;
  locked: number;
  is_admin: number;
}

async function findUser(email: string): Promise<UserRow | null> {
  return queryOne<UserRow>(
    `SELECT u.id, u.email, u.display_name, u.password_hash, u.status, u.failed_login_count,
            (u.locked_until IS NOT NULL AND u.locked_until > UTC_TIMESTAMP()) AS locked,
            EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                     WHERE ur.user_id = u.id AND r.code IN (?, ?)) AS is_admin
       FROM users u WHERE u.email = ?`,
    [ROLE_OWNER, ROLE_ADMIN, email],
  );
}

async function recordAttempt(email: string, info: RequestInfo, ok: boolean, reason: string) {
  await execute(
    'INSERT INTO login_attempts (email, ip, user_agent, succeeded, reason) VALUES (?, ?, ?, ?, ?)',
    [email, info.ip, info.userAgent, ok ? 1 : 0, reason],
  );
}

/** Failed attempts on an unknown email since its last success, within the lock window. */
async function unknownEmailFailures(email: string): Promise<number> {
  const row = await queryOne<Row & { n: number }>(
    `SELECT COUNT(*) AS n FROM login_attempts
      WHERE email = ? AND succeeded = 0 AND reason IN ('unknown_email', 'locked')
        AND created_at > UTC_TIMESTAMP() - INTERVAL ? HOUR`,
    [email, LOCK_HOURS],
  );
  return Number(row?.n ?? 0);
}

async function ipFailures(ip: string | null): Promise<number> {
  const row = await queryOne<Row & { n: number }>(
    `SELECT COUNT(*) AS n FROM login_attempts
      WHERE ip <=> ? AND succeeded = 0 AND created_at > UTC_TIMESTAMP() - INTERVAL ? MINUTE`,
    [ip, IP_WINDOW_MINUTES],
  );
  return Number(row?.n ?? 0);
}

function security(
  action: string,
  message: string,
  info: RequestInfo,
  extra: { userId?: number | null; context: AuthContext; email?: string },
) {
  return logActivity({
    source: extra.context === 'admin-cp' ? 'admin-cp' : 'host',
    level: 'security',
    action,
    message,
    actorUserId: extra.userId ?? null,
    ip: info.ip,
    userAgent: info.userAgent,
    metadata: extra.email ? { email: extra.email } : undefined,
  });
}

/** Creates a challenge, stores only hashes, sets the browser cookie and emails the code. */
async function startChallenge(args: {
  user: { id: number; email: string; display_name: string };
  purpose: Purpose;
  info: RequestInfo;
  snapshotId: number | null;
  summary: Parameters<typeof signInCodeEmail>[0]['context'];
}): Promise<boolean> {
  const token = generateToken();
  const code = generateCode();
  // Only one open challenge per user: a new sign-in cancels older codes.
  await execute(
    `UPDATE login_challenges SET consumed_at = UTC_TIMESTAMP()
      WHERE user_id = ? AND consumed_at IS NULL`,
    [args.user.id],
  );
  await execute(
    `INSERT INTO login_challenges (user_id, purpose, token_hash, code_hash, ip, snapshot_id, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP() + INTERVAL ? MINUTE)`,
    [
      args.user.id,
      args.purpose,
      sha256(token),
      codeHash(token, code),
      args.info.ip,
      args.snapshotId,
      CODE_TTL_MINUTES,
    ],
  );
  const jar = await cookies();
  jar.set(challengeCookieName(), token, {
    httpOnly: true,
    secure: getProtocol() === 'https',
    sameSite: 'lax',
    path: '/',
    maxAge: (CODE_TTL_MINUTES + 5) * 60,
  });
  return sendCode(args.user, args.purpose, code, args.summary);
}

function sendCode(
  user: { id: number; email: string; display_name: string },
  purpose: Purpose,
  code: string,
  summary: Parameters<typeof signInCodeEmail>[0]['context'],
): Promise<boolean> {
  const email =
    purpose === 'signup'
      ? signUpCodeEmail({
          siteUrl: hostUrl(),
          name: user.display_name,
          code,
          minutes: CODE_TTL_MINUTES,
        })
      : signInCodeEmail({
          siteUrl: hostUrl(),
          name: user.display_name,
          code,
          minutes: CODE_TTL_MINUTES,
          context: summary,
          forAdmin: purpose === 'admin',
        });
  return sendMail({ to: user.email, email, template: `code.${purpose}`, userId: user.id });
}

/** Step 1 of sign-in: email + password. On success a code is emailed. */
export async function startSignIn(
  rawEmail: string,
  password: string,
  context: AuthContext,
  client: ClientContext,
): Promise<StartResult> {
  const email = normaliseEmail(rawEmail);
  const info = await getRequestInfo();
  const snapshot = (outcome: string, userId?: number | null) =>
    recordSnapshot({ event: 'signin', outcome, context, email, userId, client, info });

  if (!isEmail(email) || !password || password.length > 256) {
    return { ok: false, error: 'invalid' };
  }

  if ((await ipFailures(info.ip)) >= MAX_FAILURES_PER_IP) {
    await recordAttempt(email, info, false, 'throttled');
    await snapshot('throttled');
    await security('auth.signin.throttled', 'Sign-in throttled for this IP', info, {
      context,
      email,
    });
    return { ok: false, error: 'throttled' };
  }

  const user = await findUser(email);
  // Always run scrypt so response time does not reveal whether the email exists.
  const passwordOk = await verifyPassword(password, user?.password_hash ?? (await getDummyHash()));

  if (!user) {
    const failures = (await unknownEmailFailures(email)) + 1;
    const locked = failures > MAX_CONSECUTIVE_FAILURES;
    await recordAttempt(email, info, false, locked ? 'locked' : 'unknown_email');
    await snapshot(locked ? 'locked' : 'unknown_email');
    await security('auth.signin.failed', 'Sign-in failed (unknown email)', info, {
      context,
      email,
    });
    return { ok: false, error: failures >= MAX_CONSECUTIVE_FAILURES ? 'locked' : 'invalid' };
  }

  if (user.locked) {
    await recordAttempt(email, info, false, 'locked');
    await snapshot('locked', user.id);
    await security('auth.signin.locked', 'Sign-in refused: account locked', info, {
      context,
      email,
      userId: user.id,
    });
    return { ok: false, error: 'locked' };
  }

  if (!passwordOk) {
    const failures = user.failed_login_count + 1;
    const lockNow = failures >= MAX_CONSECUTIVE_FAILURES;
    await execute(
      lockNow
        ? `UPDATE users SET failed_login_count = 0, locked_until = UTC_TIMESTAMP() + INTERVAL ${LOCK_HOURS} HOUR WHERE id = ?`
        : 'UPDATE users SET failed_login_count = failed_login_count + 1 WHERE id = ?',
      [user.id],
    );
    await recordAttempt(email, info, false, 'bad_password');
    const snap = await snapshot(lockNow ? 'locked' : 'bad_password', user.id);
    await security('auth.signin.failed', 'Sign-in failed (wrong password)', info, {
      context,
      email,
      userId: user.id,
    });
    if (lockNow) {
      await security('auth.account.locked', `Locked for ${LOCK_HOURS} hours`, info, {
        context,
        email,
        userId: user.id,
      });
      await sendMail({
        to: user.email,
        email: accountLockedEmail({
          siteUrl: hostUrl(),
          name: user.display_name,
          hours: LOCK_HOURS,
          context: snap.summary,
        }),
        template: 'account.locked',
        userId: user.id,
      });
      return { ok: false, error: 'locked' };
    }
    return { ok: false, error: 'invalid' };
  }

  if (user.status === 'disabled') {
    await recordAttempt(email, info, false, 'disabled');
    await snapshot('disabled', user.id);
    return { ok: false, error: 'disabled' };
  }

  // The control panel login must not reveal whether a non-admin account exists.
  if (context === 'admin-cp' && !user.is_admin) {
    await recordAttempt(email, info, false, 'not_admin');
    await snapshot('not_admin', user.id);
    await security('auth.signin.denied', 'Control panel sign-in by a non-admin', info, {
      context,
      email,
      userId: user.id,
    });
    return { ok: false, error: 'invalid' };
  }

  await execute('UPDATE users SET failed_login_count = 0 WHERE id = ?', [user.id]);
  await recordAttempt(email, info, true, 'password_ok');
  const snap = await snapshot('code_sent', user.id);
  // An account that never confirmed its email finishes sign-up instead.
  const purpose: Purpose =
    user.status === 'pending' ? 'signup' : context === 'admin-cp' ? 'admin' : 'signin';
  const sent = await startChallenge({
    user,
    purpose,
    info,
    snapshotId: snap.id,
    summary: snap.summary,
  });
  return sent ? { ok: true } : { ok: false, error: 'mail' };
}

/** Creates a pending account and emails a verification code. */
export async function startSignUp(
  rawName: string,
  rawEmail: string,
  password: string,
  client: ClientContext,
): Promise<StartResult> {
  const email = normaliseEmail(rawEmail);
  const name = rawName.trim().replace(/\s+/g, ' ').slice(0, 100);
  const info = await getRequestInfo();
  if (!name || !isEmail(email)) return { ok: false, error: 'bad_input' };
  if (password.length < MIN_PASSWORD_LENGTH || password.length > 256) {
    return { ok: false, error: 'weak_password' };
  }

  const recent = await queryOne<Row & { n: number }>(
    `SELECT COUNT(*) AS n FROM auth_snapshots
      WHERE event = 'signup' AND ip <=> ? AND occurred_at > UTC_TIMESTAMP() - INTERVAL 1 HOUR`,
    [info.ip],
  );
  const snapshot = (outcome: string, userId?: number | null) =>
    recordSnapshot({ event: 'signup', outcome, context: 'site', email, userId, client, info });

  if (Number(recent?.n ?? 0) >= MAX_SIGNUPS_PER_IP_PER_HOUR) {
    await snapshot('throttled');
    return { ok: false, error: 'throttled' };
  }

  const existing = await findUser(email);
  if (existing && existing.status !== 'pending') {
    await snapshot('exists', existing.id);
    return { ok: false, error: 'exists' };
  }

  const hash = await hashPassword(password);
  let userId: number;
  if (existing) {
    // Unfinished sign-up with the same email: start over with the new name and password.
    await execute('UPDATE users SET display_name = ?, password_hash = ? WHERE id = ?', [
      name,
      hash,
      existing.id,
    ]);
    userId = existing.id;
  } else {
    const conn = await getPool().getConnection();
    try {
      await conn.beginTransaction();
      const [res] = await conn.query<import('mysql2').ResultSetHeader>(
        `INSERT INTO users (email, display_name, password_hash, status) VALUES (?, ?, ?, 'pending')`,
        [email, name, hash],
      );
      userId = res.insertId;
      await conn.query(
        `INSERT IGNORE INTO user_roles (user_id, role_id)
         SELECT ?, id FROM roles WHERE code = 'platform.user'`,
        [userId],
      );
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      if ((err as { code?: string }).code === 'ER_DUP_ENTRY') return { ok: false, error: 'exists' };
      throw err;
    } finally {
      conn.release();
    }
  }

  const snap = await snapshot('code_sent', userId);
  await logActivity({
    source: 'host',
    action: 'auth.signup.started',
    actorUserId: userId,
    ip: info.ip,
    userAgent: info.userAgent,
  });
  const sent = await startChallenge({
    user: { id: userId, email, display_name: name },
    purpose: 'signup',
    info,
    snapshotId: snap.id,
    summary: snap.summary,
  });
  return sent ? { ok: true } : { ok: false, error: 'mail' };
}

interface ChallengeRow extends Row {
  id: number;
  user_id: number;
  purpose: Purpose;
  code_hash: string;
  attempts: number;
  resends: number;
  seconds_since_sent: number;
  email: string;
  display_name: string;
  status: string;
}

/** The open challenge bound to this browser, if any. */
export async function getPendingChallenge(): Promise<(ChallengeRow & { token: string }) | null> {
  const token = (await cookies()).get(challengeCookieName())?.value;
  if (!token || token.length > 100) return null;
  const row = await queryOne<ChallengeRow>(
    `SELECT c.id, c.user_id, c.purpose, c.code_hash, c.attempts, c.resends,
            TIMESTAMPDIFF(SECOND, c.code_sent_at, UTC_TIMESTAMP()) AS seconds_since_sent,
            u.email, u.display_name, u.status
       FROM login_challenges c JOIN users u ON u.id = c.user_id
      WHERE c.token_hash = ? AND c.consumed_at IS NULL AND c.expires_at > UTC_TIMESTAMP()`,
    [sha256(token)],
  );
  return row ? { ...row, token } : null;
}

async function clearChallengeCookie() {
  (await cookies()).delete({ name: challengeCookieName(), path: '/' });
}

export type VerifyResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: 'expired' | 'wrong' | 'exhausted' | 'bad_input'; remaining?: number };

/** Step 2: checks the emailed code and, if it matches, starts the session. */
export async function verifyCode(input: string, client: ClientContext): Promise<VerifyResult> {
  const challenge = await getPendingChallenge();
  if (!challenge) return { ok: false, error: 'expired' };
  const info = await getRequestInfo();
  const context: AuthContext = challenge.purpose === 'admin' ? 'admin-cp' : 'site';
  const snapshot = (outcome: string) =>
    recordSnapshot({
      event: 'verify',
      outcome,
      context,
      email: challenge.email,
      userId: challenge.user_id,
      client,
      info,
    });

  const code = normaliseCode(input);
  if (!code) return { ok: false, error: 'bad_input' };

  if (!hashesEqual(challenge.code_hash, codeHash(challenge.token, code))) {
    const attempts = challenge.attempts + 1;
    const exhausted = attempts >= MAX_CODE_ATTEMPTS;
    await execute(
      `UPDATE login_challenges SET attempts = ?, consumed_at = IF(?, UTC_TIMESTAMP(), NULL) WHERE id = ?`,
      [attempts, exhausted, challenge.id],
    );
    await snapshot(exhausted ? 'exhausted' : 'wrong_code');
    await security(
      'auth.code.failed',
      `Wrong verification code (${attempts}/${MAX_CODE_ATTEMPTS})`,
      info,
      {
        context,
        userId: challenge.user_id,
      },
    );
    if (exhausted) {
      await clearChallengeCookie();
      return { ok: false, error: 'exhausted' };
    }
    return { ok: false, error: 'wrong', remaining: MAX_CODE_ATTEMPTS - attempts };
  }

  // Single use: only the request that flips consumed_at may continue.
  const consumed = await execute(
    'UPDATE login_challenges SET consumed_at = UTC_TIMESTAMP() WHERE id = ? AND consumed_at IS NULL',
    [challenge.id],
  );
  if (consumed.affectedRows !== 1) return { ok: false, error: 'expired' };
  await clearChallengeCookie();

  if (challenge.purpose === 'signup') {
    await execute(
      `UPDATE users SET status = 'active', email_verified_at = UTC_TIMESTAMP()
        WHERE id = ? AND status = 'pending'`,
      [challenge.user_id],
    );
  } else if (challenge.status !== 'active') {
    return { ok: false, error: 'expired' };
  }

  await execute(
    'UPDATE users SET last_login_at = UTC_TIMESTAMP(), last_login_ip = ? WHERE id = ?',
    [info.ip, challenge.user_id],
  );
  await createSession(challenge.user_id, info);
  await snapshot('ok');
  await security(
    challenge.purpose === 'signup' ? 'auth.signup.completed' : 'auth.signin.success',
    challenge.purpose === 'admin' ? 'Signed in to the control panel' : 'Signed in',
    info,
    { context, userId: challenge.user_id },
  );
  return {
    ok: true,
    redirectTo: challenge.purpose === 'admin' ? '/admin-cp/dashboard' : '/account',
  };
}

export type ResendResult =
  | { ok: true }
  | { ok: false; error: 'expired' | 'cooldown' | 'limit' | 'mail'; waitSeconds?: number };

export async function resendCode(client: ClientContext): Promise<ResendResult> {
  const challenge = await getPendingChallenge();
  if (!challenge) return { ok: false, error: 'expired' };
  if (challenge.resends >= MAX_RESENDS) return { ok: false, error: 'limit' };
  const wait = RESEND_COOLDOWN_SECONDS - Number(challenge.seconds_since_sent);
  if (wait > 0) return { ok: false, error: 'cooldown', waitSeconds: wait };

  const code = generateCode();
  await execute(
    `UPDATE login_challenges
        SET code_hash = ?, attempts = 0, resends = resends + 1, code_sent_at = UTC_TIMESTAMP(),
            expires_at = UTC_TIMESTAMP() + INTERVAL ? MINUTE
      WHERE id = ?`,
    [codeHash(challenge.token, code), CODE_TTL_MINUTES, challenge.id],
  );
  const snap = await recordSnapshot({
    event: 'resend',
    outcome: 'code_sent',
    context: challenge.purpose === 'admin' ? 'admin-cp' : 'site',
    email: challenge.email,
    userId: challenge.user_id,
    client,
  });
  const sent = await sendCode(
    { id: challenge.user_id, email: challenge.email, display_name: challenge.display_name },
    challenge.purpose,
    code,
    snap.summary,
  );
  return sent ? { ok: true } : { ok: false, error: 'mail' };
}

/** "a***@example.com" for the verification page. */
export function maskEmail(email: string): string {
  const [local = '', domain = ''] = email.split('@');
  return `${local.slice(0, 1)}${'*'.repeat(Math.max(1, Math.min(local.length - 1, 6)))}@${domain}`;
}

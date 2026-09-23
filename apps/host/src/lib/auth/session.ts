import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { execute, query, queryOne, type Row } from '../db';
import { getProtocol } from '../domain';

/** Absolute lifetime of a session, and how long it may sit unused before it expires. */
export const SESSION_TTL_HOURS = 12;
export const SESSION_IDLE_MINUTES = 120;

export const ROLE_OWNER = 'platform.owner';
export const ROLE_ADMIN = 'platform.admin';

/**
 * One session cookie for everyone (site users and admins); what a user may do is decided by
 * their roles. In production it uses the "__Host-" prefix: the browser then enforces Secure,
 * Path=/ and no Domain attribute, so the session never leaks to plugin subdomains.
 * SameSite=Lax (not Strict) so links in our emails open signed in; server actions are
 * protected against CSRF by Next's Origin check.
 */
export function sessionCookieName(): string {
  return getProtocol() === 'https' ? '__Host-dq_session' : 'dq_session';
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createSession(
  userId: number,
  info: { ip: string | null; userAgent: string | null },
): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  await execute(
    `INSERT INTO sessions (user_id, token_hash, ip, user_agent, expires_at)
     VALUES (?, ?, ?, ?, UTC_TIMESTAMP() + INTERVAL ? HOUR)`,
    [userId, hashToken(token), info.ip, info.userAgent, SESSION_TTL_HOURS],
  );
  const jar = await cookies();
  jar.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: getProtocol() === 'https',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_HOURS * 60 * 60,
  });
}

export interface SessionUser {
  sessionId: number;
  userId: number;
  email: string;
  displayName: string;
  roles: string[];
  /** Owner: full admin panel including users, statistics and the activity log. */
  isOwner: boolean;
  /** May use /admin-cp at all (owner or admin). */
  isAdmin: boolean;
}

interface SessionRow extends Row {
  session_id: number;
  user_id: number;
  email: string;
  display_name: string;
  stale: number;
}

/** The signed-in user for this request, or null. Cached per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  if (!token || token.length > 100) return null;

  const row = await queryOne<SessionRow>(
    `SELECT s.id AS session_id, u.id AS user_id, u.email, u.display_name,
            s.last_seen_at < UTC_TIMESTAMP() - INTERVAL 5 MINUTE AS stale
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?
        AND s.revoked_at IS NULL
        AND s.expires_at > UTC_TIMESTAMP()
        AND s.last_seen_at > UTC_TIMESTAMP() - INTERVAL ? MINUTE
        AND u.status = 'active'`,
    [hashToken(token), SESSION_IDLE_MINUTES],
  );
  if (!row) return null;

  const roles = (
    await query<Row & { code: string }>(
      `SELECT r.code FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?`,
      [row.user_id],
    )
  ).map((r) => r.code);

  // Sliding idle timeout; only touch the row every few minutes to limit writes.
  if (row.stale) {
    await execute('UPDATE sessions SET last_seen_at = UTC_TIMESTAMP() WHERE id = ?', [
      row.session_id,
    ]);
  }

  const isOwner = roles.includes(ROLE_OWNER);
  return {
    sessionId: row.session_id,
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    roles,
    isOwner,
    isAdmin: isOwner || roles.includes(ROLE_ADMIN),
  };
});

/** Revokes the current session (if any) and clears the cookie. */
export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  if (token) {
    await execute(
      'UPDATE sessions SET revoked_at = UTC_TIMESTAMP() WHERE token_hash = ? AND revoked_at IS NULL',
      [hashToken(token)],
    );
  }
  jar.delete({ name: sessionCookieName(), path: '/' });
}

/** Signs a user out everywhere (used when an owner disables an account). */
export async function revokeAllSessions(userId: number): Promise<void> {
  await execute(
    'UPDATE sessions SET revoked_at = UTC_TIMESTAMP() WHERE user_id = ? AND revoked_at IS NULL',
    [userId],
  );
}

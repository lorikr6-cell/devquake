import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { execute, query, queryOne, type Row } from '../db';
import { getProtocol, sharedCookieDomain } from '../domain';

/** Absolute lifetime of a session, and how long it may sit unused before it expires. */
export const SESSION_TTL_HOURS = 12;
export const SESSION_IDLE_MINUTES = 120;
/**
 * Active use of an app keeps a session going (ADR 0014: the activity ping and plugin API calls),
 * but never past this long after sign-in.
 */
export const SESSION_EXTENDED_MAX_HOURS = 24;
/** The most one extension adds from now. */
export const SESSION_EXTEND_STEP_HOURS = 3;

export const ROLE_OWNER = 'platform.owner';
export const ROLE_ADMIN = 'platform.admin';

/**
 * One session cookie for everyone (site users and admins); what a user may do is decided by
 * their roles. It is shared with every app subdomain (Domain=.devquake.com) so an app can check
 * that the visitor is subscribed (ADR 0006). In production it uses the "__Secure-" prefix: the
 * browser only accepts it over HTTPS. HttpOnly, so page scripts (including apps) cannot read it.
 * SameSite=Lax (not Strict) so links in our emails open signed in; server actions are
 * protected against CSRF by Next's Origin check.
 */
export function sessionCookieName(): string {
  return getProtocol() === 'https' ? '__Secure-dq_session' : 'dq_session';
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
    domain: sharedCookieDomain(),
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
  /** When the session ends unless it is extended. */
  expiresAt: Date;
}

interface SessionRow extends Row {
  session_id: number;
  user_id: number;
  email: string;
  display_name: string;
  stale: number;
  expires_at: Date;
}

/** The signed-in user for this request, or null. Cached per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  if (!token || token.length > 100) return null;

  const row = await queryOne<SessionRow>(
    `SELECT s.id AS session_id, u.id AS user_id, u.email, u.display_name, s.expires_at,
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
    expiresAt: new Date(row.expires_at),
  };
});

/**
 * Keeps a session that an app is actively using from ending (ADR 0014): its end moves to at
 * least `hours` from now (1..SESSION_EXTEND_STEP_HOURS), capped at SESSION_EXTENDED_MAX_HOURS
 * after sign-in, and the cookie is renewed to match. Only valid, unrevoked sessions move.
 * Must run where cookies can be set (route handlers, server actions). Returns the new end.
 */
export async function extendSession(sessionId: number, hours: number): Promise<Date | null> {
  const step = Math.min(SESSION_EXTEND_STEP_HOURS, Math.max(1, Math.round(hours)));
  await execute(
    `UPDATE sessions
        SET expires_at = LEAST(created_at + INTERVAL ? HOUR,
                               GREATEST(expires_at, UTC_TIMESTAMP() + INTERVAL ? HOUR))
      WHERE id = ? AND revoked_at IS NULL AND expires_at > UTC_TIMESTAMP()`,
    [SESSION_EXTENDED_MAX_HOURS, step, sessionId],
  );
  const row = await queryOne<Row & { expires_at: Date; seconds_left: number }>(
    `SELECT expires_at, TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), expires_at) AS seconds_left
       FROM sessions WHERE id = ? AND revoked_at IS NULL`,
    [sessionId],
  );
  if (!row || row.seconds_left <= 0) return null;
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  if (token) {
    jar.set(sessionCookieName(), token, {
      httpOnly: true,
      secure: getProtocol() === 'https',
      sameSite: 'lax',
      path: '/',
      domain: sharedCookieDomain(),
      maxAge: Number(row.seconds_left),
    });
  }
  return new Date(row.expires_at);
}

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
  jar.delete({ name: sessionCookieName(), path: '/', domain: sharedCookieDomain() });
}

/** Signs a user out everywhere (used when an owner disables an account). */
export async function revokeAllSessions(userId: number): Promise<void> {
  await execute(
    'UPDATE sessions SET revoked_at = UTC_TIMESTAMP() WHERE user_id = ? AND revoked_at IS NULL',
    [userId],
  );
}

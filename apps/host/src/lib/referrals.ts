import 'server-only';
import { randomInt } from 'node:crypto';
import { logActivity } from './activity';
import type { PluginPerson } from '@devquake/plugin-sdk';
import { ROLE_ADMIN, ROLE_OWNER, type SessionUser } from './auth/session';
import { isEmail } from './auth/signup-rules';
import { execute, query, queryOne, type Row } from './db';
import { hostUrl } from './domain';
import { sendMail } from './mail/mailer';
import { referralInviteEmail } from './mail/templates';
import type { RequestInfo } from './request';

/**
 * Referrals: every user has a personal invite link (devquake.com/r/<code>), shown with a QR
 * code, and can invite people by email. An invited person who creates an account is linked to
 * the inviter ("signed_up"); when they activate it the inviter's NPS goes up by one ("joined").
 * Points are only awarded on activation so unconfirmed fake sign-ups earn nothing.
 */

/** Cookie set by /r/<code> so the sign-up that follows is attributed (30 days). */
export const REF_COOKIE = 'dq_ref';
export const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const MAX_INVITES_PER_DAY = 20;

// No 0/O/1/I/L: readable when typed from a printed QR label.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const REFERRAL_CODE_PATTERN = /^[A-HJ-KM-NP-Z2-9]{8}$/;

function newCode(): string {
  let code = '';
  for (let i = 0; i < 8; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

export function referralUrl(code: string): string {
  return `${hostUrl()}/r/${code}`;
}

export function referralQrUrl(code: string): string {
  return `${hostUrl()}/r/${code}/qr`;
}

/** The user's referral code, created on first use. */
export async function getOrCreateReferralCode(userId: number): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const row = await queryOne<Row & { referral_code: string | null }>(
      'SELECT referral_code FROM users WHERE id = ?',
      [userId],
    );
    if (row?.referral_code) return row.referral_code;
    try {
      await execute('UPDATE users SET referral_code = ? WHERE id = ? AND referral_code IS NULL', [
        newCode(),
        userId,
      ]);
    } catch (err) {
      if ((err as { code?: string }).code !== 'ER_DUP_ENTRY') throw err;
    }
  }
  throw new Error('Could not create a referral code');
}

export interface Inviter {
  id: number;
  display_name: string;
}

/** The active user behind a referral code, if any. */
export async function inviterByCode(code: string | undefined | null): Promise<Inviter | null> {
  if (!code || !REFERRAL_CODE_PATTERN.test(code)) return null;
  return queryOne<Row & Inviter>(
    "SELECT id, display_name FROM users WHERE referral_code = ? AND status = 'active'",
    [code],
  );
}

export interface InviteRow extends Row {
  id: number;
  email: string | null;
  via_link: number;
  status: 'sent' | 'signed_up' | 'joined';
  created_at: Date;
  joined_at: Date | null;
}

export function listInvites(userId: number) {
  return query<InviteRow>(
    `SELECT id, email, via_link, status, created_at, joined_at FROM referral_invites
      WHERE inviter_id = ? ORDER BY created_at DESC, id DESC LIMIT 100`,
    [userId],
  );
}

export async function getNps(userId: number): Promise<number> {
  const row = await queryOne<Row & { nps: number }>('SELECT nps FROM users WHERE id = ?', [userId]);
  return Number(row?.nps ?? 0);
}

export type InviteResult =
  | { ok: true; email: string }
  | { ok: false; error: 'invalid' | 'self' | 'member' | 'duplicate' | 'limit' | 'mail' };

/** Emails an invitation (QR code + link, naming the inviter) and records it. */
export async function sendInvite(
  user: SessionUser,
  rawEmail: string,
  info: RequestInfo,
): Promise<InviteResult> {
  const email = rawEmail.trim().toLowerCase().slice(0, 254);
  if (!isEmail(email)) return { ok: false, error: 'invalid' };
  if (email === user.email.toLowerCase()) return { ok: false, error: 'self' };

  const member = await queryOne<Row & { id: number }>(
    "SELECT id FROM users WHERE email = ? AND status <> 'pending'",
    [email],
  );
  if (member) return { ok: false, error: 'member' };

  const recent = await queryOne<Row & { today: number; same: number }>(
    `SELECT SUM(created_at > UTC_TIMESTAMP() - INTERVAL 1 DAY) AS today,
            SUM(email = ? AND created_at > UTC_TIMESTAMP() - INTERVAL 1 DAY) AS same
       FROM referral_invites WHERE inviter_id = ? AND via_link = 0`,
    [email, user.userId],
  );
  if (Number(recent?.same ?? 0) > 0) return { ok: false, error: 'duplicate' };
  if (Number(recent?.today ?? 0) >= MAX_INVITES_PER_DAY) return { ok: false, error: 'limit' };

  const code = await getOrCreateReferralCode(user.userId);
  const sent = await sendMail({
    to: email,
    template: 'referral.invite',
    replyTo: user.email,
    email: referralInviteEmail({
      siteUrl: hostUrl(),
      inviterName: user.displayName,
      inviteUrl: referralUrl(code),
      qrUrl: referralQrUrl(code),
    }),
  });
  if (!sent) return { ok: false, error: 'mail' };

  const result = await execute('INSERT INTO referral_invites (inviter_id, email) VALUES (?, ?)', [
    user.userId,
    email,
  ]);
  await logActivity({
    source: 'host',
    action: 'referral.invited',
    message: email,
    actorUserId: user.userId,
    entityType: 'referral_invite',
    entityId: result.insertId,
    ip: info.ip,
    userAgent: info.userAgent,
  });
  return { ok: true, email };
}

/**
 * Called when an account is created (pending). Attribution: an email invite to this address
 * wins (latest one); otherwise the referral code from the /r/<code> cookie.
 */
export async function recordSignUpReferral(
  newUserId: number,
  email: string,
  refCode: string | undefined,
): Promise<void> {
  // A repeated sign-up of the same (still pending) account is already attributed.
  const existing = await queryOne<Row & { id: number }>(
    'SELECT id FROM referral_invites WHERE invitee_user_id = ? LIMIT 1',
    [newUserId],
  );
  if (existing) return;
  const invite = await queryOne<Row & { id: number; inviter_id: number }>(
    `SELECT i.id, i.inviter_id FROM referral_invites i JOIN users u ON u.id = i.inviter_id
      WHERE i.email = ? AND i.status = 'sent' AND u.status = 'active' AND i.inviter_id <> ?
      ORDER BY i.created_at DESC LIMIT 1`,
    [email, newUserId],
  );
  if (invite) {
    await execute(
      `UPDATE referral_invites SET status = 'signed_up', invitee_user_id = ?, signed_up_at = UTC_TIMESTAMP()
        WHERE id = ?`,
      [newUserId, invite.id],
    );
    await execute('UPDATE users SET referred_by = ? WHERE id = ? AND referred_by IS NULL', [
      invite.inviter_id,
      newUserId,
    ]);
    return;
  }
  const inviter = await inviterByCode(refCode);
  if (!inviter || inviter.id === newUserId) return;
  // Sign-up through a shared link: the new member's address is not shown to the inviter.
  await execute(
    `INSERT INTO referral_invites (inviter_id, email, via_link, status, invitee_user_id, signed_up_at)
     VALUES (?, NULL, 1, 'signed_up', ?, UTC_TIMESTAMP())`,
    [inviter.id, newUserId],
  );
  await execute('UPDATE users SET referred_by = ? WHERE id = ? AND referred_by IS NULL', [
    inviter.id,
    newUserId,
  ]);
}

/** Called when an account is activated: the inviter earns +1 NPS, exactly once. */
export async function completeReferral(newUserId: number): Promise<void> {
  const invite = await queryOne<Row & { id: number; inviter_id: number }>(
    `SELECT id, inviter_id FROM referral_invites
      WHERE invitee_user_id = ? AND status = 'signed_up' ORDER BY id DESC LIMIT 1`,
    [newUserId],
  );
  if (!invite) return;
  const joined = await execute(
    `UPDATE referral_invites SET status = 'joined', joined_at = UTC_TIMESTAMP()
      WHERE id = ? AND status = 'signed_up'`,
    [invite.id],
  );
  if (joined.affectedRows !== 1) return;
  await execute('UPDATE users SET nps = nps + 1 WHERE id = ?', [invite.inviter_id]);
  await logActivity({
    source: 'host',
    action: 'referral.joined',
    message: 'A person you invited joined DevQuake (+1 NPS)',
    actorUserId: invite.inviter_id,
    entityType: 'referral_invite',
    entityId: invite.id,
  });
}

/**
 * The user's referral network, for apps (ctx.people, ADR 0007): active accounts they referred
 * plus their own referrer. `hasAccess` says whether each person can already open the app of
 * `pluginId` (admin, assigned or subscribed).
 */
export async function referralNetwork(userId: number, pluginId: string): Promise<PluginPerson[]> {
  const rows = await query<
    Row & {
      id: number;
      display_name: string;
      relation: PluginPerson['relation'];
      has_access: number;
    }
  >(
    `SELECT u.id, u.display_name, n.relation,
            (EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                      WHERE ur.user_id = u.id AND r.code IN (?, ?))
             OR EXISTS (SELECT 1 FROM project_subscriptions s JOIN projects p ON p.id = s.project_id
                         WHERE s.user_id = u.id AND p.plugin_id = ?)
             OR EXISTS (SELECT 1 FROM user_projects a JOIN projects p ON p.id = a.project_id
                         WHERE a.user_id = u.id AND p.plugin_id = ?)) AS has_access
       FROM (SELECT id, 'referred' AS relation FROM users WHERE referred_by = ?
             UNION
             SELECT referred_by, 'referrer' FROM users WHERE id = ? AND referred_by IS NOT NULL) n
       JOIN users u ON u.id = n.id
      WHERE u.status = 'active' AND u.id <> ?
      ORDER BY u.display_name`,
    [ROLE_OWNER, ROLE_ADMIN, pluginId, pluginId, userId, userId, userId],
  );
  return rows.map((r) => ({
    id: r.id,
    displayName: r.display_name,
    relation: r.relation,
    hasAccess: Number(r.has_access) === 1,
  }));
}

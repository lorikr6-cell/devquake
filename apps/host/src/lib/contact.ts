import 'server-only';
import { logActivity } from './activity';
import { ADMIN_BASE } from './auth/admin';
import { isEmail } from './auth/flow';
import { getSessionUser } from './auth/session';
import { parseUserAgent } from './auth/user-agent';
import { execute, query, queryOne, type Row } from './db';
import { hostUrl } from './domain';
import { sendMail } from './mail/mailer';
import { CONTACT_EMAIL, contactNotificationEmail, contactReplyEmail } from './mail/templates';
import { getRequestInfo } from './request';
import { maybeRunRetention } from './retention';
import { DEFAULT_LOCALE, isLocale } from '@devquake/ui';
import { getLocale } from '@/i18n/server';
import { userLocale } from './user-locale';

const MAX_PER_IP_PER_HOUR = 3;
/** Signed-in members are known, so they may write a little more often. */
const MAX_PER_USER_PER_HOUR = 5;
/** Humans need a few seconds to fill in the form; bots usually post instantly. */
const MIN_FILL_SECONDS = 3;

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Hidden field real visitors never fill in. */
  website: string;
  /** Epoch ms when the form was rendered. */
  startedAt: number;
}

export type ContactResult =
  | { ok: true; member: boolean }
  | { ok: false; error: 'invalid' | 'throttled' | 'unavailable'; field?: string };

/**
 * Stores a contact message and emails it to CONTACT_EMAIL. Signed-in members write with their
 * account's name and email (whatever the form sent) and must give a subject; they later see the
 * message and the owner's replies on /account/messages.
 */
export async function submitContact(input: ContactInput): Promise<ContactResult> {
  const user = await getSessionUser().catch(() => null);
  const name = (user?.displayName ?? input.name).trim().replace(/\s+/g, ' ').slice(0, 100);
  const email = (user?.email ?? input.email).trim().toLowerCase().slice(0, 254);
  const subject = input.subject.trim().replace(/\s+/g, ' ').slice(0, 150) || null;
  const message = input.message.trim().slice(0, 5000);

  if (user && !subject) return { ok: false, error: 'invalid', field: 'subject' };
  if (!name) return { ok: false, error: 'invalid', field: 'name' };
  if (!isEmail(email)) return { ok: false, error: 'invalid', field: 'email' };
  if (message.length < 10) return { ok: false, error: 'invalid', field: 'message' };

  const info = await getRequestInfo();
  const tooFast = !input.startedAt || Date.now() - input.startedAt < MIN_FILL_SECONDS * 1000;
  // Spam: pretend success so bots learn nothing, but store and send nothing.
  if (input.website || tooFast) {
    await logActivity({
      source: 'host',
      level: 'notice',
      action: 'contact.spam_blocked',
      message: input.website ? 'Honeypot filled' : 'Submitted too fast',
      ip: info.ip,
      userAgent: info.userAgent,
    });
    return { ok: true, member: !!user };
  }

  const recent = await queryOne<Row & { n: number }>(
    user
      ? `SELECT COUNT(*) AS n FROM contact_messages
          WHERE user_id = ? AND created_at > UTC_TIMESTAMP() - INTERVAL 1 HOUR`
      : `SELECT COUNT(*) AS n FROM contact_messages
          WHERE ip <=> ? AND created_at > UTC_TIMESTAMP() - INTERVAL 1 HOUR`,
    [user ? user.userId : info.ip],
  );
  const limit = user ? MAX_PER_USER_PER_HOUR : MAX_PER_IP_PER_HOUR;
  if (Number(recent?.n ?? 0) >= limit) return { ok: false, error: 'throttled' };

  const values = [user?.userId ?? null, name, email, subject, message, info.ip, info.userAgent];
  // The page language, so the reply email is in it (migration 0016; older databases without it).
  const locale = await getLocale();
  const result = await execute(
    `INSERT INTO contact_messages (user_id, name, email, subject, message, ip, user_agent, locale)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [...values, locale],
  ).catch((err: { code?: string }) => {
    if (err.code !== 'ER_BAD_FIELD_ERROR') throw err;
    return execute(
      `INSERT INTO contact_messages (user_id, name, email, subject, message, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      values,
    );
  });

  const ua = parseUserAgent(info.userAgent);
  const device =
    [ua.browser && `${ua.browser}${ua.browserVersion ? ` ${ua.browserVersion}` : ''}`, ua.os]
      .filter(Boolean)
      .join(' on ') || null;
  const emailed = await sendMail({
    to: CONTACT_EMAIL,
    replyTo: email,
    template: 'contact.notification',
    email: contactNotificationEmail({
      siteUrl: hostUrl(),
      adminUrl: `${hostUrl()}${ADMIN_BASE}`,
      name,
      email,
      subject,
      message,
      context: { location: null, device, vpn: null },
    }),
  });
  if (emailed) {
    await execute('UPDATE contact_messages SET emailed = 1 WHERE id = ?', [result.insertId]);
  }
  void maybeRunRetention();
  await logActivity({
    source: 'host',
    action: 'contact.received',
    message: subject ?? `Message from ${name}`,
    actorUserId: user?.userId ?? null,
    entityType: 'contact_message',
    entityId: result.insertId,
    ip: info.ip,
    userAgent: info.userAgent,
  });
  return { ok: true, member: !!user };
}

// ---- owner view ----------------------------------------------------------------------------

export const MESSAGE_STATUSES = ['new', 'read', 'archived'] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export interface ContactMessageRow extends Row {
  id: number;
  created_at: Date;
  user_id: number | null;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  ip: string | null;
  status: MessageStatus;
  emailed: number;
}

export interface ContactReplyRow extends Row {
  id: number;
  message_id: number;
  created_at: Date;
  body: string;
  emailed: number;
  author_name: string | null;
}

/** Replies of the given messages, oldest first, by message id. */
async function repliesOf(ids: number[]): Promise<Map<number, ContactReplyRow[]>> {
  const map = new Map<number, ContactReplyRow[]>();
  if (ids.length === 0) return map;
  const rows = await query<ContactReplyRow>(
    `SELECT r.id, r.message_id, r.created_at, r.body, r.emailed, u.display_name AS author_name
       FROM contact_replies r LEFT JOIN users u ON u.id = r.author_user_id
      WHERE r.message_id IN (${ids.map(() => '?').join(', ')})
      ORDER BY r.created_at, r.id`,
    ids,
  ).catch(() => []); // before migration 0015: no replies yet
  for (const r of rows) map.set(r.message_id, [...(map.get(r.message_id) ?? []), r]);
  return map;
}

export async function listMessages(status?: string) {
  const filter = (MESSAGE_STATUSES as readonly string[]).includes(status ?? '') ? status : null;
  const messages = await query<ContactMessageRow>(
    `SELECT id, created_at, user_id, name, email, subject, message, ip, status, emailed
       FROM contact_messages
      ${filter ? 'WHERE status = ?' : "WHERE status <> 'archived'"}
      ORDER BY created_at DESC LIMIT 200`,
    filter ? [filter] : [],
  );
  const replies = await repliesOf(messages.map((m) => m.id));
  return messages.map((m) => ({ ...m, replies: replies.get(m.id) ?? [] }));
}

export async function countNewMessages(): Promise<number> {
  const row = await queryOne<Row & { n: number }>(
    "SELECT COUNT(*) AS n FROM contact_messages WHERE status = 'new'",
  );
  return Number(row?.n ?? 0);
}

export async function setMessageStatus(id: number, status: MessageStatus): Promise<void> {
  await execute('UPDATE contact_messages SET status = ? WHERE id = ?', [status, id]);
}

/** The owner deletes a message (its replies go with it). */
export async function deleteMessage(id: number): Promise<boolean> {
  const { affectedRows } = await execute('DELETE FROM contact_messages WHERE id = ?', [id]);
  return affectedRows > 0;
}

/**
 * The owner answers a message: stored (members see it on their account) and emailed to the
 * sender, so people who wrote without an account get it too. A new message becomes "read".
 */
export async function replyToMessage(
  messageId: number,
  authorUserId: number,
  body: string,
): Promise<{ emailed: boolean } | null> {
  const message = await queryOne<ContactMessageRow & { locale?: string | null }>(
    'SELECT * FROM contact_messages WHERE id = ?',
    [messageId],
  );
  if (!message) return null;
  const result = await execute(
    'INSERT INTO contact_replies (message_id, author_user_id, body) VALUES (?, ?, ?)',
    [messageId, authorUserId, body],
  );
  await execute("UPDATE contact_messages SET status = 'read' WHERE id = ? AND status = 'new'", [
    messageId,
  ]);
  // Members get it in the language they use now; visitors in the one they wrote in.
  const written = isLocale(message.locale) ? message.locale : DEFAULT_LOCALE;
  const locale = message.user_id ? await userLocale(message.user_id, written) : written;
  const emailed = await sendMail({
    to: message.email,
    template: 'contact.reply',
    userId: message.user_id,
    email: contactReplyEmail({
      siteUrl: hostUrl(),
      name: message.name,
      subject: message.subject,
      original: message.message,
      reply: body,
      messagesPath: message.user_id ? MY_MESSAGES_PATH : null,
      locale,
    }),
  });
  if (emailed) {
    await execute('UPDATE contact_replies SET emailed = 1 WHERE id = ?', [result.insertId]);
  }
  return { emailed };
}

// ---- a member's own messages (/account/messages) --------------------------------------------

export const MY_MESSAGES_PATH = '/account/messages';

export interface MyMessage {
  id: number;
  created_at: Date;
  subject: string | null;
  message: string;
  /** When the member last opened their messages (replies after it are new). */
  seenAt: Date | null;
  replies: ContactReplyRow[];
}

/** The member's messages, newest first, with the replies. Never other people's messages. */
export async function listMyMessages(userId: number): Promise<MyMessage[]> {
  const rows = await query<
    Row & {
      id: number;
      created_at: Date;
      subject: string | null;
      message: string;
      user_seen_at: Date | null;
    }
  >(
    `SELECT id, created_at, subject, message, user_seen_at FROM contact_messages
      WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 100`,
    [userId],
  );
  const replies = await repliesOf(rows.map((r) => r.id));
  return rows.map((r) => ({
    id: r.id,
    created_at: r.created_at,
    subject: r.subject,
    message: r.message,
    seenAt: r.user_seen_at,
    replies: replies.get(r.id) ?? [],
  }));
}

/** Replies the member has not seen yet (the badge on "Messages"); 0 before migration 0015. */
export async function countUnreadReplies(userId: number): Promise<number> {
  const row = await queryOne<Row & { n: number }>(
    `SELECT COUNT(*) AS n FROM contact_replies r JOIN contact_messages m ON m.id = r.message_id
      WHERE m.user_id = ? AND (m.user_seen_at IS NULL OR r.created_at > m.user_seen_at)`,
    [userId],
  ).catch(() => null);
  return Number(row?.n ?? 0);
}

export async function markRepliesSeen(userId: number): Promise<void> {
  await execute('UPDATE contact_messages SET user_seen_at = UTC_TIMESTAMP() WHERE user_id = ?', [
    userId,
  ]).catch(() => {});
}

/** A member deletes one of their own messages (with its replies). */
export async function deleteMyMessage(userId: number, id: number): Promise<boolean> {
  const { affectedRows } = await execute(
    'DELETE FROM contact_messages WHERE id = ? AND user_id = ?',
    [id, userId],
  );
  return affectedRows > 0;
}

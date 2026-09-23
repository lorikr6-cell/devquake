import 'server-only';
import { logActivity } from './activity';
import { ADMIN_BASE } from './auth/admin';
import { isEmail } from './auth/flow';
import { getSessionUser } from './auth/session';
import { parseUserAgent } from './auth/user-agent';
import { execute, query, queryOne, type Row } from './db';
import { hostUrl } from './domain';
import { sendMail } from './mail/mailer';
import { CONTACT_EMAIL, contactNotificationEmail } from './mail/templates';
import { getRequestInfo } from './request';
import { maybeRunRetention } from './retention';

const MAX_PER_IP_PER_HOUR = 3;
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
  { ok: true } | { ok: false; error: 'invalid' | 'throttled' | 'unavailable'; field?: string };

export async function submitContact(input: ContactInput): Promise<ContactResult> {
  const name = input.name.trim().replace(/\s+/g, ' ').slice(0, 100);
  const email = input.email.trim().toLowerCase().slice(0, 254);
  const subject = input.subject.trim().slice(0, 150) || null;
  const message = input.message.trim().slice(0, 5000);

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
    return { ok: true };
  }

  const recent = await queryOne<Row & { n: number }>(
    `SELECT COUNT(*) AS n FROM contact_messages
      WHERE ip <=> ? AND created_at > UTC_TIMESTAMP() - INTERVAL 1 HOUR`,
    [info.ip],
  );
  if (Number(recent?.n ?? 0) >= MAX_PER_IP_PER_HOUR) return { ok: false, error: 'throttled' };

  const user = await getSessionUser().catch(() => null);
  const result = await execute(
    `INSERT INTO contact_messages (user_id, name, email, subject, message, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user?.userId ?? null, name, email, subject, message, info.ip, info.userAgent],
  );

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
  return { ok: true };
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

export function listMessages(status?: string) {
  const filter = (MESSAGE_STATUSES as readonly string[]).includes(status ?? '') ? status : null;
  return query<ContactMessageRow>(
    `SELECT id, created_at, user_id, name, email, subject, message, ip, status, emailed
       FROM contact_messages
      ${filter ? 'WHERE status = ?' : "WHERE status <> 'archived'"}
      ORDER BY created_at DESC LIMIT 200`,
    filter ? [filter] : [],
  );
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

import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import { execute } from '../db';
import { CONTACT_EMAIL, type Email } from './templates';

/**
 * SMTP sending (Hostinger email). Environment variables:
 *   SMTP_USER, SMTP_PWD          mailbox credentials (required to send)
 *   SMTP_HOST, SMTP_PORT         default smtp.hostinger.com:465 (TLS); 587 uses STARTTLS
 *   MAIL_FROM                    default "DevQuake <SMTP_USER>" — Hostinger only accepts a
 *                                sender that matches the authenticated mailbox
 * Without credentials, development prints emails to the server console instead of sending;
 * production reports the send as failed. `pnpm mail:test` checks the settings from a terminal.
 */
const globalForMail = globalThis as unknown as { devquakeMailer?: Transporter };

/** Env values trimmed: a space pasted into hPanel must not break the login. */
const env = (name: string) => process.env[name]?.trim() || undefined;

function transporter(): Transporter | null {
  const user = env('SMTP_USER');
  const pass = env('SMTP_PWD');
  if (!user || !pass) return null;
  if (globalForMail.devquakeMailer) return globalForMail.devquakeMailer;
  const port = Number(env('SMTP_PORT') || 465);
  globalForMail.devquakeMailer = nodemailer.createTransport({
    host: env('SMTP_HOST') || 'smtp.hostinger.com',
    port,
    secure: port === 465,
    auth: { user, pass },
    // Fail fast (sign-in waits for this) instead of nodemailer's 2-minute defaults.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return globalForMail.devquakeMailer;
}

/** The SMTP details that explain a failure (code, server response, failing step). */
export function describeSmtpError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const e = err as Error & {
    code?: string;
    responseCode?: number;
    command?: string;
    response?: string;
  };
  return [
    e.code && `[${e.code}]`,
    e.responseCode && `SMTP ${e.responseCode}`,
    e.command && `during ${e.command}`,
    e.response && e.response !== e.message ? `${e.message} — ${e.response}` : e.message,
  ]
    .filter(Boolean)
    .join(' ');
}

export interface SendArgs {
  to: string;
  email: Email;
  template: string;
  userId?: number | null;
  /** Defaults to contact@devquake.com; the contact form sets it to the visitor. */
  replyTo?: string;
  /** false: do not keep an email_outbox row (e.g. the goodbye email after account deletion). */
  record?: boolean;
}

/** Sends one email and records it in email_outbox. Returns true when it was handed to SMTP. */
export async function sendMail({
  to,
  email,
  template,
  userId,
  replyTo,
  record = true,
}: SendArgs): Promise<boolean> {
  let status: 'sent' | 'failed' | 'logged' = 'sent';
  let error: string | null = null;

  const smtp = transporter();
  const from = env('MAIL_FROM') || `DevQuake <${env('SMTP_USER') ?? CONTACT_EMAIL}>`;
  if (!smtp) {
    if (process.env.NODE_ENV !== 'production') {
      status = 'logged';
      console.info(
        `\n[mail] (not sent: SMTP not configured) to=${to}\n${email.subject}\n${email.text}`,
      );
    } else {
      status = 'failed';
      error = 'SMTP_USER / SMTP_PWD not configured';
      console.error(`[mail] ${error}`);
    }
  } else {
    try {
      await smtp.sendMail({
        from,
        replyTo: replyTo ?? CONTACT_EMAIL,
        to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
    } catch (err) {
      status = 'failed';
      error = describeSmtpError(err);
      console.error(`[mail] send failed (${template} to ${to}): ${error}`);
    }
  }

  if (!record) return status !== 'failed';
  try {
    await execute(
      `INSERT INTO email_outbox (user_id, to_email, template, subject, status, error)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId ?? null,
        to,
        template,
        email.subject.slice(0, 200),
        status,
        error?.slice(0, 500) ?? null,
      ],
    );
  } catch (err) {
    console.error('[mail] failed to record outbox row', err);
  }
  return status !== 'failed';
}

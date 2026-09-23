import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import { execute } from '../db';
import { CONTACT_EMAIL, type Email } from './templates';

/**
 * SMTP sending (Hostinger email). Environment variables:
 *   SMTP_USER, SMTP_PWD          mailbox credentials (required to send)
 *   SMTP_HOST, SMTP_PORT         default smtp.hostinger.com:465 (TLS)
 *   MAIL_FROM                    default "DevQuake <contact@devquake.com>"
 * Without credentials, development prints emails to the server console instead of sending;
 * production reports the send as failed.
 */
const globalForMail = globalThis as unknown as { devquakeMailer?: Transporter };

function transporter(): Transporter | null {
  if (!process.env.SMTP_USER || !process.env.SMTP_PWD) return null;
  if (globalForMail.devquakeMailer) return globalForMail.devquakeMailer;
  const port = Number(process.env.SMTP_PORT || 465);
  globalForMail.devquakeMailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PWD },
  });
  return globalForMail.devquakeMailer;
}

export interface SendArgs {
  to: string;
  email: Email;
  template: string;
  userId?: number | null;
  /** Defaults to contact@devquake.com; the contact form sets it to the visitor. */
  replyTo?: string;
}

/** Sends one email and records it in email_outbox. Returns true when it was handed to SMTP. */
export async function sendMail({
  to,
  email,
  template,
  userId,
  replyTo,
}: SendArgs): Promise<boolean> {
  let status: 'sent' | 'failed' | 'logged' = 'sent';
  let error: string | null = null;

  const smtp = transporter();
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
        from: process.env.MAIL_FROM || `DevQuake <${CONTACT_EMAIL}>`,
        replyTo: replyTo ?? CONTACT_EMAIL,
        to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
    } catch (err) {
      status = 'failed';
      error = err instanceof Error ? err.message : String(err);
      console.error('[mail] send failed', err);
    }
  }

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

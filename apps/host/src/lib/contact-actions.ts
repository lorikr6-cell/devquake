'use server';

import { refresh } from 'next/cache';
import { logActivity } from './activity';
import { getSessionUser } from './auth/session';
import { deleteMyMessage, submitContact } from './contact';
import { CONTACT_EMAIL } from './mail/templates';
import { getRequestInfo } from './request';
import { getT } from '@/i18n/server';

export interface ContactFormState {
  ok?: boolean;
  /** Sent from an account: the message and its replies are on /account/messages. */
  member?: boolean;
  error?: string;
  /** Echoed back so the form keeps what was typed after an error. */
  values?: { name: string; email: string; subject: string; message: string };
}

// Catalog keys under contact.errors (ADR 0011).
const FIELD_ERRORS = new Set(['name', 'email', 'subject', 'message']);

export async function contactAction(
  _prev: ContactFormState,
  form: FormData,
): Promise<ContactFormState> {
  const t = await getT('contact.errors');
  const values = {
    name: String(form.get('name') ?? '').slice(0, 100),
    email: String(form.get('email') ?? '').slice(0, 254),
    subject: String(form.get('subject') ?? '').slice(0, 150),
    message: String(form.get('message') ?? '').slice(0, 5000),
  };
  try {
    const result = await submitContact({
      ...values,
      website: String(form.get('website') ?? ''),
      startedAt: Number(form.get('started_at') ?? 0),
    });
    if (result.ok) {
      // Members see the new message in their list right away.
      if (result.member) refresh();
      return { ok: true, member: result.member };
    }
    if (result.error === 'throttled') {
      return { error: t('throttled', { email: CONTACT_EMAIL }), values };
    }
    const field = result.field ?? '';
    return { error: FIELD_ERRORS.has(field) ? t(field) : t('check'), values };
  } catch (err) {
    console.error('[contact] failed', err);
    return { error: t('failed', { email: CONTACT_EMAIL }), values };
  }
}

/** A member deletes one of their messages (and the replies to it). */
export async function deleteMyMessageAction(id: number): Promise<void> {
  const user = await getSessionUser().catch(() => null);
  if (!user) return;
  if (await deleteMyMessage(user.userId, id)) {
    const info = await getRequestInfo();
    await logActivity({
      source: 'host',
      action: 'contact.deleted',
      message: 'by the sender',
      actorUserId: user.userId,
      entityType: 'contact_message',
      entityId: id,
      ip: info.ip,
      userAgent: info.userAgent,
    });
  }
  refresh();
}

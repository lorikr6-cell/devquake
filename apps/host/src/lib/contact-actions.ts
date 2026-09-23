'use server';

import { submitContact } from './contact';
import { CONTACT_EMAIL } from './mail/templates';

export interface ContactFormState {
  ok?: boolean;
  error?: string;
  /** Echoed back so the form keeps what was typed after an error. */
  values?: { name: string; email: string; subject: string; message: string };
}

const FIELD_ERRORS: Record<string, string> = {
  name: 'Please enter your name.',
  email: 'Please enter a valid email address.',
  message: 'Please write a message of at least 10 characters.',
};

export async function contactAction(
  _prev: ContactFormState,
  form: FormData,
): Promise<ContactFormState> {
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
    if (result.ok) return { ok: true };
    if (result.error === 'throttled') {
      return {
        error: `You have sent several messages recently. Please try again later or email ${CONTACT_EMAIL}.`,
        values,
      };
    }
    return { error: FIELD_ERRORS[result.field ?? ''] ?? 'Please check the form.', values };
  } catch (err) {
    console.error('[contact] failed', err);
    return {
      error: `Your message could not be sent right now. Please email ${CONTACT_EMAIL} instead.`,
      values,
    };
  }
}

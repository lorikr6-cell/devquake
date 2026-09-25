'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser } from './auth/session';
import { CONTACT_EMAIL } from './legal';
import { sendInvite } from './referrals';
import { getRequestInfo } from './request';
import { getT } from '@/i18n/server';

export interface InviteFormState {
  ok?: boolean;
  error?: string;
  /** Echoed so the field keeps its value after an error. */
  email?: string;
  /** Address the last invitation went to. */
  sentTo?: string;
}

// Catalog keys under account.invite.errors (ADR 0011).
const MESSAGES = {
  invalid: 'invalid',
  self: 'self',
  member: 'member',
  duplicate: 'duplicate',
  limit: 'limit',
  mail: 'mail',
} as const;

export async function inviteAction(
  _prev: InviteFormState,
  form: FormData,
): Promise<InviteFormState> {
  const email = String(form.get('email') ?? '').slice(0, 254);
  const t = await getT('account.invite.errors');
  const user = await getSessionUser();
  if (!user) return { error: t('signIn'), email };
  try {
    const result = await sendInvite(user, email, await getRequestInfo());
    if (!result.ok) return { error: t(MESSAGES[result.error], { email: CONTACT_EMAIL }), email };
    revalidatePath('/account');
    return { ok: true, sentTo: result.email };
  } catch (err) {
    console.error('[referrals] invite failed', err);
    return { error: t('mail', { email: CONTACT_EMAIL }), email };
  }
}

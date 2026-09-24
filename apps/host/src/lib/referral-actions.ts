'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser } from './auth/session';
import { CONTACT_EMAIL } from './legal';
import { sendInvite } from './referrals';
import { getRequestInfo } from './request';

export interface InviteFormState {
  ok?: boolean;
  error?: string;
  /** Echoed so the field keeps its value after an error. */
  email?: string;
  /** Address the last invitation went to. */
  sentTo?: string;
}

const MESSAGES = {
  invalid: 'Enter a valid email address, like name@example.com.',
  self: 'That is your own address. Invite someone else.',
  member: 'This person already has a DevQuake account.',
  duplicate: 'You already invited this address today.',
  limit: 'You reached today’s limit of 20 invitations. Try again tomorrow.',
  mail: `The invitation could not be sent. Try again later or contact ${CONTACT_EMAIL}.`,
} as const;

export async function inviteAction(
  _prev: InviteFormState,
  form: FormData,
): Promise<InviteFormState> {
  const email = String(form.get('email') ?? '').slice(0, 254);
  const user = await getSessionUser();
  if (!user) return { error: 'Please sign in again.', email };
  try {
    const result = await sendInvite(user, email, await getRequestInfo());
    if (!result.ok) return { error: MESSAGES[result.error], email };
    revalidatePath('/account');
    return { ok: true, sentTo: result.email };
  } catch (err) {
    console.error('[referrals] invite failed', err);
    return { error: MESSAGES.mail, email };
  }
}

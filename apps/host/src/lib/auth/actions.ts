'use server';

import { redirect } from 'next/navigation';
import { logActivity } from '../activity';
import { getRequestInfo } from '../request';
import { CONTACT_EMAIL } from '../mail/templates';
import {
  LOCK_HOURS,
  MIN_PASSWORD_LENGTH,
  resendCode,
  startSignIn,
  startSignUp,
  verifyCode,
  type AuthContext,
  type AuthError,
} from './flow';
import { destroySession, getSessionUser } from './session';
import { readClientContext } from './snapshot';

export interface FormState {
  error?: string;
  info?: string;
  /** Echoed back so the form keeps what was typed (React resets forms after an action). */
  email?: string;
  name?: string;
  /** Sign-up finished: the welcome email with the activation link is on its way. */
  signedUp?: boolean;
}

const MESSAGES: Record<AuthError, string> = {
  invalid: `Wrong email or password. After 3 failed attempts in a row the account is locked for ${LOCK_HOURS} hours.`,
  locked: `Too many failed attempts. This account is locked for ${LOCK_HOURS} hours.`,
  throttled: 'Too many attempts from your network. Try again later.',
  disabled: `This account is disabled. Contact ${CONTACT_EMAIL}.`,
  mail: `We could not send the email with your code. Try again, or contact ${CONTACT_EMAIL}.`,
  exists: 'An account with this email already exists. Sign in instead.',
  weak_password: `Use a password with at least ${MIN_PASSWORD_LENGTH} characters.`,
  bad_input: 'Enter your name and a valid email address.',
  not_activated:
    'Your account is not activated yet. We emailed you an activation link: open it, then sign in here.',
};

const UNAVAILABLE = 'Sign-in is temporarily unavailable. Please try again in a moment.';

function contextOf(form: FormData): AuthContext {
  return form.get('context') === 'admin-cp' ? 'admin-cp' : 'site';
}

function verifyPath(context: AuthContext): string {
  return context === 'admin-cp' ? '/admin-cp/verify' : '/verify';
}

export async function signInAction(_prev: FormState, form: FormData): Promise<FormState> {
  const context = contextOf(form);
  const email = String(form.get('email') ?? '').slice(0, 254);
  let result;
  try {
    result = await startSignIn(
      String(form.get('email') ?? ''),
      String(form.get('password') ?? ''),
      context,
      readClientContext(form),
    );
  } catch (err) {
    console.error('[auth] sign-in error', err);
    return { error: UNAVAILABLE, email };
  }
  if (!result.ok) return { error: MESSAGES[result.error], email };
  redirect(verifyPath(context));
}

export async function signUpAction(_prev: FormState, form: FormData): Promise<FormState> {
  const keep = {
    email: String(form.get('email') ?? '').slice(0, 254),
    name: String(form.get('name') ?? '').slice(0, 100),
  };
  if (form.get('password') !== form.get('password_confirm')) {
    return { error: 'The passwords do not match.', ...keep };
  }
  let result;
  try {
    result = await startSignUp(
      String(form.get('name') ?? ''),
      String(form.get('email') ?? ''),
      String(form.get('password') ?? ''),
      readClientContext(form),
    );
  } catch (err) {
    console.error('[auth] sign-up error', err);
    return { error: UNAVAILABLE, ...keep };
  }
  if (!result.ok) return { error: MESSAGES[result.error], ...keep };
  return { signedUp: true, email: keep.email };
}

export async function verifyAction(_prev: FormState, form: FormData): Promise<FormState> {
  let result;
  try {
    result = await verifyCode(String(form.get('code') ?? ''), readClientContext(form));
  } catch (err) {
    console.error('[auth] verify error', err);
    return { error: UNAVAILABLE };
  }
  if (!result.ok) {
    switch (result.error) {
      case 'bad_input':
        return { error: 'Enter the 6-digit code from the email.' };
      case 'wrong':
        return {
          error: `That code is not correct. ${result.remaining} ${result.remaining === 1 ? 'try' : 'tries'} left.`,
        };
      case 'exhausted':
        return { error: 'Too many wrong codes. Sign in again to get a new one.' };
      default:
        return { error: 'This code has expired. Sign in again to get a new one.' };
    }
  }
  redirect(result.redirectTo);
}

export async function resendAction(_prev: FormState, form: FormData): Promise<FormState> {
  let result;
  try {
    result = await resendCode(readClientContext(form));
  } catch (err) {
    console.error('[auth] resend error', err);
    return { error: UNAVAILABLE };
  }
  if (result.ok) return { info: 'We sent you a new code. The previous one no longer works.' };
  switch (result.error) {
    case 'cooldown':
      return { error: `Please wait ${result.waitSeconds} seconds before asking for a new code.` };
    case 'limit':
      return { error: 'No more codes can be sent for this sign-in. Sign in again.' };
    case 'mail':
      return { error: MESSAGES.mail };
    default:
      return { error: 'This sign-in has expired. Sign in again.' };
  }
}

export async function signOutAction(form: FormData): Promise<void> {
  const user = await getSessionUser().catch(() => null);
  await destroySession();
  if (user) {
    const info = await getRequestInfo();
    await logActivity({
      source: form.get('context') === 'admin-cp' ? 'admin-cp' : 'host',
      level: 'security',
      action: 'auth.signout',
      actorUserId: user.userId,
      ip: info.ip,
      userAgent: info.userAgent,
    });
  }
  redirect(form.get('context') === 'admin-cp' ? '/admin-cp' : '/');
}

'use server';

import { redirect } from 'next/navigation';
import { getLocale, getT, localized } from '@/i18n/server';
import { getRequestInfo } from '../request';
import { MIN_PASSWORD_LENGTH } from './signup-rules';
import {
  RESET_TTL_MINUTES,
  clearResetCookie,
  requestPasswordReset,
  resetPassword,
  resetTokenFromCookie,
} from './password-reset';

export interface ForgotState {
  error?: string;
  /** The link is on its way (shown whether or not the address has an account). */
  sent?: boolean;
  email?: string;
}

/** "Forgot your password?": emails a link to choose a new one (ADR 0017). */
export async function forgotPasswordAction(
  _prev: ForgotState,
  form: FormData,
): Promise<ForgotState> {
  const t = await getT('auth');
  const email = String(form.get('email') ?? '').slice(0, 254);
  try {
    const result = await requestPasswordReset(email, await getRequestInfo(), await getLocale());
    if (!result.ok) {
      return {
        error: result.error === 'throttled' ? t('errors.throttled') : t('signup.errors.email'),
        email,
      };
    }
  } catch (err) {
    console.error('[auth] password reset request failed', err);
    return { error: t('errors.unavailable'), email };
  }
  return { sent: true, email };
}

export interface ResetState {
  error?: string;
}

/** Sets the new password from the emailed link, then sends the member to sign in. */
export async function resetPasswordAction(_prev: ResetState, form: FormData): Promise<ResetState> {
  const t = await getT('auth');
  const password = String(form.get('password') ?? '');
  if (password !== form.get('password_confirm')) return { error: t('errors.mismatch') };
  let result;
  try {
    result = await resetPassword(await resetTokenFromCookie(), password, await getRequestInfo());
  } catch (err) {
    console.error('[auth] password reset failed', err);
    return { error: t('errors.unavailable') };
  }
  if (!result.ok) {
    switch (result.error) {
      case 'weak_password':
        return { error: t('errors.weakPassword', { min: MIN_PASSWORD_LENGTH }) };
      case 'expired':
        return { error: t('reset.expired', { minutes: RESET_TTL_MINUTES }) };
      default:
        return { error: t('reset.invalid') };
    }
  }
  await clearResetCookie();
  redirect(`${await localized('/')}?reset=ok#account`);
}

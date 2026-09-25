'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getT, localized } from '@/i18n/server';
import { localizePath, type Translate } from '@devquake/ui';
import { rememberLanguageCookie } from '../language-actions';
import { preferredLocale } from '../user-locale';
import { userTheme } from '../user-themes';
import { THEME_COOKIE, THEME_COOKIE_MAX_AGE } from '../theme';
import { sharedCookieDomain } from '../domain';
import { REF_COOKIE } from '../referrals';
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
import { getProtocol } from '../domain';
import { RETURN_COOKIE, RETURN_COOKIE_MAX_AGE, safeReturnUrl } from '../return-url';

export interface FormState {
  error?: string;
  info?: string;
  /** Echoed back so the form keeps what was typed (React resets forms after an action). */
  email?: string;
  name?: string;
  /** Sign-up finished: the welcome email with the activation link is on its way. */
  signedUp?: boolean;
}

// Error texts are in the page language (auth.errors in the catalog, ADR 0011).
const ERROR_KEYS: Record<AuthError, string> = {
  invalid: 'invalid',
  locked: 'locked',
  throttled: 'throttled',
  disabled: 'disabled',
  mail: 'mail',
  exists: 'exists',
  weak_password: 'weakPassword',
  bad_input: 'badInput',
  not_activated: 'notActivated',
};

function message(t: Translate, error: AuthError): string {
  return t(ERROR_KEYS[error], {
    hours: LOCK_HOURS,
    email: CONTACT_EMAIL,
    min: MIN_PASSWORD_LENGTH,
  });
}

function contextOf(form: FormData): AuthContext {
  return form.get('context') === 'admin-cp' ? 'admin-cp' : 'site';
}

function verifyPath(context: AuthContext): string {
  return context === 'admin-cp' ? '/admin-cp/verify' : '/verify';
}

export async function signInAction(_prev: FormState, form: FormData): Promise<FormState> {
  const context = contextOf(form);
  const t = await getT('auth.errors');
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
    return { error: t('unavailable'), email };
  }
  if (!result.ok) return { error: message(t, result.error), email };
  // Remember where the visitor came from (an app subdomain) until the code is verified.
  const jar = await cookies();
  const back = context === 'site' ? safeReturnUrl(form.get('return_to')) : null;
  if (back) {
    jar.set(RETURN_COOKIE, back, {
      httpOnly: true,
      secure: getProtocol() === 'https',
      sameSite: 'lax',
      path: '/',
      maxAge: RETURN_COOKIE_MAX_AGE,
    });
  } else {
    jar.delete(RETURN_COOKIE);
  }
  redirect(await localized(verifyPath(context)));
}

export async function signUpAction(_prev: FormState, form: FormData): Promise<FormState> {
  const t = await getT('auth.errors');
  const keep = {
    email: String(form.get('email') ?? '').slice(0, 254),
    name: String(form.get('name') ?? '').slice(0, 100),
  };
  if (form.get('password') !== form.get('password_confirm')) {
    return { error: t('mismatch'), ...keep };
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
    return { error: t('unavailable'), ...keep };
  }
  if (!result.ok) return { error: message(t, result.error), ...keep };
  // The invitation (if any) has been used for this sign-up.
  (await cookies()).delete(REF_COOKIE);
  return { signedUp: true, email: keep.email };
}

export async function verifyAction(_prev: FormState, form: FormData): Promise<FormState> {
  const t = await getT('auth.errors');
  let result;
  try {
    result = await verifyCode(String(form.get('code') ?? ''), readClientContext(form));
  } catch (err) {
    console.error('[auth] verify error', err);
    return { error: t('unavailable') };
  }
  if (!result.ok) {
    switch (result.error) {
      case 'bad_input':
        return { error: t('codeFormat') };
      case 'wrong':
        return { error: t('codeWrong', { count: result.remaining ?? 0 }) };
      case 'exhausted':
        return { error: t('codeExhausted') };
      default:
        return { error: t('codeExpired') };
    }
  }
  // The language chosen on the profile applies from every sign-in on (ADR 0017); the control
  // panel stays English.
  const preferred = result.purpose === 'admin' ? null : await preferredLocale(result.userId);
  if (preferred) await rememberLanguageCookie(preferred);
  // The theme the member last chose, on any device (ADR 0017); nothing if they never chose.
  const theme = await userTheme(result.userId).catch(() => null);
  if (theme) {
    const jar = await cookies();
    if (theme === 'adaptive')
      jar.delete({ name: THEME_COOKIE, path: '/', domain: sharedCookieDomain() });
    else {
      jar.set(THEME_COOKIE, theme, {
        path: '/',
        maxAge: THEME_COOKIE_MAX_AGE,
        sameSite: 'lax',
        secure: getProtocol() === 'https',
        domain: sharedCookieDomain(),
      });
    }
  }
  if (result.redirectTo === '/account') {
    const jar = await cookies();
    const back = safeReturnUrl(jar.get(RETURN_COOKIE)?.value);
    jar.delete(RETURN_COOKIE);
    if (back) redirect(back);
  }
  redirect(
    preferred ? localizePath(result.redirectTo, preferred) : await localized(result.redirectTo),
  );
}

export async function resendAction(_prev: FormState, form: FormData): Promise<FormState> {
  const t = await getT('auth');
  let result;
  try {
    result = await resendCode(readClientContext(form));
  } catch (err) {
    console.error('[auth] resend error', err);
    return { error: t('errors.unavailable') };
  }
  if (result.ok) return { info: t('resent') };
  switch (result.error) {
    case 'cooldown':
      return { error: t('errors.cooldown', { seconds: result.waitSeconds ?? 0 }) };
    case 'limit':
      return { error: t('errors.resendLimit') };
    case 'mail':
      return { error: t('errors.mail', { email: CONTACT_EMAIL }) };
    default:
      return { error: t('errors.signInExpired') };
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
  // Session revoked and cookie deleted: always back to the landing page, also from admin-cp.
  redirect(await localized('/'));
}

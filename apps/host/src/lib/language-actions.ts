'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
  localizePath,
  type Locale,
} from '@devquake/ui';
import { getSessionUser } from './auth/session';
import { sharedCookieDomain } from './domain';
import { savePreferredLocale } from './user-locale';
import { getT, localized } from '@/i18n/server';

export interface LanguageState {
  error?: string;
  saved?: boolean;
}

/** Sets the dq_lang cookie for devquake.com and every app, as the language picker does. */
export async function rememberLanguageCookie(locale: Locale): Promise<void> {
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: 'lax',
    domain: sharedCookieDomain(),
  });
}

/**
 * The preferred language on the profile (ADR 0017): used at every sign-in and for emails. A
 * chosen language is applied at once (the account page reopens in it); "automatic" keeps
 * following the language the member browses in.
 */
export async function saveLanguageAction(
  _prev: LanguageState,
  form: FormData,
): Promise<LanguageState> {
  const user = await getSessionUser();
  if (!user) redirect(`${await localized('/')}#account`);
  const value = String(form.get('locale') ?? '');
  const locale = isLocale(value) ? value : null;
  if (value && !locale) return { error: (await getT('account.language'))('failed') };
  try {
    await savePreferredLocale(user.userId, locale);
  } catch (err) {
    console.error('[account] could not save the language', err);
    return { error: (await getT('account.language'))('failed') };
  }
  revalidatePath('/', 'layout');
  if (!locale) return { saved: true };
  await rememberLanguageCookie(locale);
  redirect(`${localizePath('/account', locale)}?language=saved#profile`);
}

import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEFAULT_LOCALE, isLocale, localizePath, type Locale, type Translate } from '@devquake/ui';
import { translatorFor } from './translate';

export { translatorFor };

/** The page language, set by the proxy from the URL prefix (ADR 0011). */
export async function getLocale(): Promise<Locale> {
  const value = (await headers()).get('x-devquake-locale');
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** The path without its language prefix, e.g. "/ideas/4" (for language alternates). */
export async function getPathWithoutLocale(): Promise<string> {
  return (await headers()).get('x-devquake-path') ?? '/';
}

/** t('area.key', params) in the page language (English for missing keys). */
export async function getT(namespace?: string): Promise<Translate> {
  return translatorFor(await getLocale(), namespace);
}

/** A root-relative path in the page language ("/ideas" → "/de/ideas"). */
export async function localized(path: string): Promise<string> {
  return localizePath(path, await getLocale());
}

/** redirect() that keeps the page language. Use it instead of redirect() outside /admin-cp. */
export async function localizedRedirect(path: string): Promise<never> {
  redirect(await localized(path));
}

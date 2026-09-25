import 'server-only';
import { after } from 'next/server';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@devquake/ui';
import { execute, queryOne, type Row } from './db';

// The language each member last used (users.locale, migration 0016) and the one they chose in
// their profile (users.preferred_locale, migration 0018). Emails to them are written in the
// chosen language, else the last used one (ADR 0011, ADR 0017). Everything here tolerates a
// database without those migrations.

// What this server process last stored per user, so a page view normally writes nothing.
const remembered = new Map<number, Locale>();

/** Records the page language for a signed-in member (after the response is sent). */
export function rememberLocale(userId: number, locale: Locale): void {
  if (remembered.get(userId) === locale) return;
  remembered.set(userId, locale);
  after(async () => {
    await execute('UPDATE users SET locale = ? WHERE id = ? AND (locale IS NULL OR locale <> ?)', [
      locale,
      userId,
      locale,
    ]).catch(() => remembered.delete(userId));
  });
}

/** The member's language for emails, or `fallback` (the page language) when not known. */
export async function userLocale(
  userId: number,
  fallback: Locale = DEFAULT_LOCALE,
): Promise<Locale> {
  const row = await queryOne<Row & { locale: string | null; preferred: string | null }>(
    'SELECT locale, preferred_locale AS preferred FROM users WHERE id = ?',
    [userId],
  ).catch(() =>
    queryOne<Row & { locale: string | null; preferred: null }>(
      'SELECT locale, NULL AS preferred FROM users WHERE id = ?',
      [userId],
    ).catch(() => null),
  );
  if (isLocale(row?.preferred)) return row.preferred;
  return isLocale(row?.locale) ? row.locale : fallback;
}

/** The language the member chose in their profile; null = automatic. */
export async function preferredLocale(userId: number): Promise<Locale | null> {
  const row = await queryOne<Row & { preferred_locale: string | null }>(
    'SELECT preferred_locale FROM users WHERE id = ?',
    [userId],
  ).catch(() => null);
  return isLocale(row?.preferred_locale) ? row.preferred_locale : null;
}

/** Saves the profile choice (null = automatic). A chosen language is also the last used one. */
export async function savePreferredLocale(userId: number, locale: Locale | null): Promise<void> {
  await execute(
    locale
      ? 'UPDATE users SET preferred_locale = ?, locale = ? WHERE id = ?'
      : 'UPDATE users SET preferred_locale = NULL WHERE id = ?',
    locale ? [locale, locale, userId] : [userId],
  );
  if (locale) remembered.set(userId, locale);
}

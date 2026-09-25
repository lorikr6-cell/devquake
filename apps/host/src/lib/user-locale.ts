import 'server-only';
import { after } from 'next/server';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@devquake/ui';
import { execute, queryOne, type Row } from './db';

// The language each member last used (users.locale, migration 0016): emails to them are written
// in it (ADR 0011). Everything here tolerates a database without that migration.

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
  const row = await queryOne<Row & { locale: string | null }>(
    'SELECT locale FROM users WHERE id = ?',
    [userId],
  ).catch(() => null);
  return isLocale(row?.locale) ? row.locale : fallback;
}

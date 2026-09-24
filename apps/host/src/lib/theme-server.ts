import 'server-only';
import { cookies } from 'next/headers';
import { THEME_COOKIE, parseTheme, type Theme } from './theme';

/** The visitor's theme choice from the shared cookie ("adaptive" when none). */
export async function getTheme(): Promise<Theme> {
  return parseTheme((await cookies()).get(THEME_COOKIE)?.value);
}

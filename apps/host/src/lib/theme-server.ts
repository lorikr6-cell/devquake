import 'server-only';
import { cookies } from 'next/headers';
import { getSessionUser } from './auth/session';
import type { ThemeSettings } from './custom-theme';
import { THEME_COOKIE, customThemeId, parseTheme, type Theme } from './theme';
import { themeForViewer } from './user-themes';

/** The visitor's theme choice from the shared cookie ("adaptive" when none). */
export async function getTheme(): Promise<Theme> {
  return parseTheme((await cookies()).get(THEME_COOKIE)?.value);
}

/**
 * The chosen custom theme's settings (ADR 0017), when the signed-in member may still use it
 * (their own, or shared with them). Null for built-in themes, signed-out visitors, deleted or
 * no longer shared themes: the page then falls back to Adaptive.
 */
export async function getCustomTheme(theme: Theme): Promise<ThemeSettings | null> {
  const id = customThemeId(theme);
  if (!id || !process.env.MAIN_DB_NAME) return null;
  const user = await getSessionUser().catch(() => null);
  return user ? themeForViewer(id, user.userId) : null;
}

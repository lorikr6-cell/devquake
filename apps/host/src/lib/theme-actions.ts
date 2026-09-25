'use server';

import { revalidatePath } from 'next/cache';
import { getT } from '@/i18n/server';
import { getSessionUser } from './auth/session';
import {
  MAX_SHARES_PER_THEME,
  MAX_THEMES_PER_USER,
  cleanThemeName,
  parseThemeSettings,
} from './custom-theme';
import { getRequestInfo } from './request';
import { deleteTheme, leaveSharedTheme, saveTheme, shareTheme, unshareTheme } from './user-themes';

// Custom themes (ADR 0017). Every action re-checks the signed-in member and ownership; texts come
// back in the page language.

export type ThemeActionResult =
  { ok: true; id?: number; name?: string } | { ok: false; error: string };

async function member() {
  return getSessionUser().catch(() => null);
}

/** Creates (themeId null) or updates one of the member's themes. */
export async function saveThemeAction(
  themeId: number | null,
  name: string,
  settingsJson: string,
): Promise<ThemeActionResult> {
  const t = await getT('common.customTheme.errors');
  const user = await member();
  if (!user) return { ok: false, error: t('signIn') };
  const clean = cleanThemeName(name);
  if (!clean) return { ok: false, error: t('name') };
  const settings = parseThemeSettings(settingsJson);
  if (!settings) return { ok: false, error: t('invalid') };
  try {
    const result = await saveTheme(user.userId, themeId, clean, settings);
    if (!result.ok) {
      return {
        ok: false,
        error: result.error === 'limit' ? t('limit', { count: MAX_THEMES_PER_USER }) : t('missing'),
      };
    }
    revalidatePath('/', 'layout');
    return { ok: true, id: result.id };
  } catch (err) {
    console.error('[themes] save failed', err);
    return { ok: false, error: t('failed') };
  }
}

export async function deleteThemeAction(themeId: number): Promise<ThemeActionResult> {
  const t = await getT('common.customTheme.errors');
  const user = await member();
  if (!user) return { ok: false, error: t('signIn') };
  try {
    if (!(await deleteTheme(user.userId, themeId))) return { ok: false, error: t('missing') };
  } catch (err) {
    console.error('[themes] delete failed', err);
    return { ok: false, error: t('failed') };
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}

/** Shares a theme with a DevQuake member by email address (existing accounts only). */
export async function shareThemeAction(themeId: number, email: string): Promise<ThemeActionResult> {
  const t = await getT('common.customTheme.errors');
  const user = await member();
  if (!user) return { ok: false, error: t('signIn') };
  try {
    const result = await shareTheme(user.userId, themeId, email, await getRequestInfo());
    if (!result.ok) {
      return {
        ok: false,
        error:
          result.error === 'limit'
            ? t('shareLimit', { count: MAX_SHARES_PER_THEME })
            : t(
                {
                  invalid: 'email',
                  missing: 'missing',
                  self: 'self',
                  unknown: 'unknown',
                  throttled: 'throttled',
                }[result.error],
              ),
      };
    }
    revalidatePath('/', 'layout');
    return { ok: true, name: result.name };
  } catch (err) {
    console.error('[themes] share failed', err);
    return { ok: false, error: t('failed') };
  }
}

export async function unshareThemeAction(
  themeId: number,
  userId: number,
): Promise<ThemeActionResult> {
  const t = await getT('common.customTheme.errors');
  const user = await member();
  if (!user) return { ok: false, error: t('signIn') };
  await unshareTheme(user.userId, themeId, userId);
  revalidatePath('/', 'layout');
  return { ok: true };
}

/** Removes a theme someone shared with the member from their list. */
export async function leaveSharedThemeAction(themeId: number): Promise<ThemeActionResult> {
  const t = await getT('common.customTheme.errors');
  const user = await member();
  if (!user) return { ok: false, error: t('signIn') };
  await leaveSharedTheme(user.userId, themeId);
  revalidatePath('/', 'layout');
  return { ok: true };
}

// Applying a theme in the browser (header picker, theme editor preview). Browser-only helpers;
// the server renders the same attributes and CSS on the first load (root layout).

import { baseMode, themeCss, type ThemeSettings } from './custom-theme';
import { THEME_COOKIE, THEME_COOKIE_MAX_AGE, type BuiltInTheme, type Theme } from './theme';

export const CUSTOM_STYLE_ID = 'dq-custom-theme';

/** What the page currently shows, so a preview can be undone exactly. */
export interface PageThemeSnapshot {
  dataTheme: string | null;
  customTheme: string | null;
  css: string;
}

function styleElement(): HTMLStyleElement {
  let el = document.getElementById(CUSTOM_STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = CUSTOM_STYLE_ID;
    document.head.appendChild(el);
  }
  return el;
}

export function snapshotPageTheme(): PageThemeSnapshot {
  const root = document.documentElement;
  return {
    dataTheme: root.getAttribute('data-theme'),
    customTheme: root.getAttribute('data-custom-theme'),
    css: document.getElementById(CUSTOM_STYLE_ID)?.textContent ?? '',
  };
}

export function restorePageTheme(s: PageThemeSnapshot): void {
  const root = document.documentElement;
  if (s.dataTheme) root.setAttribute('data-theme', s.dataTheme);
  else root.removeAttribute('data-theme');
  if (s.customTheme) root.setAttribute('data-custom-theme', s.customTheme);
  else root.removeAttribute('data-custom-theme');
  styleElement().textContent = s.css;
}

/** Shows a custom theme on the page (`key` marks which one, e.g. its id or "preview"). */
export function showCustomTheme(settings: ThemeSettings, key: string): void {
  const root = document.documentElement;
  styleElement().textContent = themeCss(settings);
  root.setAttribute('data-custom-theme', key);
  root.setAttribute('data-theme', baseMode(settings));
}

export function showBuiltInTheme(theme: BuiltInTheme): void {
  const root = document.documentElement;
  root.removeAttribute('data-custom-theme');
  const el = document.getElementById(CUSTOM_STYLE_ID);
  if (el) el.textContent = '';
  if (theme === 'adaptive') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

/** Remembers the choice for devquake.com and every app ("adaptive" stores nothing). */
export function saveThemeCookie(theme: Theme, cookieDomain?: string): void {
  const domain = cookieDomain ? `; domain=${cookieDomain}` : '';
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    theme === 'adaptive'
      ? `${THEME_COOKIE}=; Max-Age=0; path=/${domain}${secure}; SameSite=Lax`
      : `${THEME_COOKIE}=${theme}; Max-Age=${THEME_COOKIE_MAX_AGE}; path=/${domain}${secure}; SameSite=Lax`;
}

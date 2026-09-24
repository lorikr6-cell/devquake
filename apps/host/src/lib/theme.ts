// Plain constants shared by the server (root layout) and the header theme picker.

/** "adaptive" follows the device setting; it is the default and stores no preference. */
export const THEMES = ['adaptive', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

/** Cookie with the visitor's choice, shared with every *.devquake.com app (1 year). */
export const THEME_COOKIE = 'dq_theme';
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseTheme(value: string | undefined | null): Theme {
  return value === 'light' || value === 'dark' ? value : 'adaptive';
}

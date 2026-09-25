// Plain constants shared by the server (root layout) and the header theme picker.

/** "adaptive" follows the device setting; it is the default and stores no preference. */
export const THEMES = ['adaptive', 'light', 'dark'] as const;
export type BuiltInTheme = (typeof THEMES)[number];
/** A member's custom theme (ADR 0017), by its id in user_themes. */
export type CustomThemeChoice = `custom-${number}`;
export type Theme = BuiltInTheme | CustomThemeChoice;

/** Cookie with the visitor's choice, shared with every *.devquake.com app (1 year). */
export const THEME_COOKIE = 'dq_theme';
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseTheme(value: string | undefined | null): Theme {
  if (value === 'light' || value === 'dark') return value;
  if (value && /^custom-[1-9]\d{0,9}$/.test(value)) return value as CustomThemeChoice;
  return 'adaptive';
}

/** The custom theme's id, or null for the built-in themes. */
export function customThemeId(theme: Theme): number | null {
  return theme.startsWith('custom-') ? Number(theme.slice(7)) : null;
}

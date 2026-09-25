// Custom colour themes that members make (ADR 0017): colours for the background, the text and
// the accent, and a font per HTML element. Pure and browser-safe: the server renders a saved
// theme into the page, and the editor uses the same code for its live preview.
//
// Only validated values ever reach the CSS: colours match #rrggbb and fonts are ids from
// FONT_CHOICES, so a theme (which other members may receive) cannot inject anything.

export const FONT_TARGETS = [
  'body',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'a',
  'li',
  'label',
  'button',
  'input',
] as const;
export type FontTarget = (typeof FONT_TARGETS)[number];

/** CSS selectors per target (inside the themed page). */
const TARGET_SELECTORS: Record<FontTarget, string> = {
  body: 'body',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  p: 'p',
  a: 'a',
  li: 'li',
  label: 'label, legend',
  button: 'button',
  input: 'input, textarea, select',
};

/**
 * Fonts a theme can use. Web fonts are self-hosted from npm packages (app/theme-fonts.ts; a font
 * file is only downloaded when a theme uses it); the rest are fonts every device has.
 */
export const FONT_CHOICES = {
  system: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  brand: 'var(--font-bricolage), system-ui, sans-serif',
  inter: "'Inter Variable', system-ui, sans-serif",
  roboto: "'Roboto', system-ui, sans-serif",
  poppins: "'Poppins', system-ui, sans-serif",
  nunito: "'Nunito Variable', system-ui, sans-serif",
  lora: "'Lora Variable', Georgia, serif",
  merriweather: "'Merriweather', Georgia, serif",
  playfair: "'Playfair Display Variable', Georgia, serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono Variable', ui-monospace, 'Cascadia Code', Consolas, monospace",
} as const;
export type FontId = keyof typeof FONT_CHOICES;
export const FONT_IDS = Object.keys(FONT_CHOICES) as FontId[];

/** Display names of the fonts (proper names, the same in every language). */
export const FONT_NAMES: Record<FontId, string> = {
  system: 'System',
  brand: 'Bricolage Grotesque',
  inter: 'Inter',
  roboto: 'Roboto',
  poppins: 'Poppins',
  nunito: 'Nunito',
  lora: 'Lora',
  merriweather: 'Merriweather',
  playfair: 'Playfair Display',
  serif: 'Georgia',
  mono: 'JetBrains Mono',
};

export interface ThemeColors {
  background: string;
  text: string;
  accent: string;
}

export interface ThemeSettings {
  colors: ThemeColors;
  /** Only the elements whose font changes; the rest keep the site's fonts. */
  fonts: Partial<Record<FontTarget, FontId>>;
}

export const THEME_NAME_MAX = 60;
export const MAX_THEMES_PER_USER = 20;
export const MAX_SHARES_PER_THEME = 25;

/** A starting point for a new theme: the brand's Paper, Ink and Quake. */
export const DEFAULT_THEME: ThemeSettings = {
  colors: { background: '#F4F1EA', text: '#16181D', accent: '#E4572E' },
  fonts: {},
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export function isHex(value: unknown): value is string {
  return typeof value === 'string' && HEX.test(value);
}

/** Reads settings from storage or a form; null when anything is not valid. */
export function parseThemeSettings(input: unknown): ThemeSettings | null {
  let value = input;
  if (typeof value === 'string') {
    if (value.length > 4000) return null;
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== 'object') return null;
  const { colors, fonts } = value as { colors?: Record<string, unknown>; fonts?: unknown };
  if (!colors || !isHex(colors.background) || !isHex(colors.text) || !isHex(colors.accent)) {
    return null;
  }
  const clean: ThemeSettings['fonts'] = {};
  if (fonts && typeof fonts === 'object') {
    for (const [target, font] of Object.entries(fonts as Record<string, unknown>)) {
      if (!(FONT_TARGETS as readonly string[]).includes(target)) return null;
      if (font === null || font === undefined || font === '') continue;
      if (typeof font !== 'string' || !(font in FONT_CHOICES)) return null;
      clean[target as FontTarget] = font as FontId;
    }
  }
  return {
    colors: {
      background: colors.background.toUpperCase(),
      text: colors.text.toUpperCase(),
      accent: colors.accent.toUpperCase(),
    },
    fonts: clean,
  };
}

export function cleanThemeName(name: unknown): string | null {
  const clean = String(name ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, THEME_NAME_MAX);
  return clean || null;
}

// ---- colour maths -------------------------------------------------------------------------

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const part = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

/** HSV (h 0–360, s and v 0–1) of a colour, for the colour picker's square and hue bar. */
export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

export function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1–21. Body text needs 4.5 (AA). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Which of the site's two modes the theme builds on: dark backgrounds use the dark mode's
 * styles (cards, borders, form fields), light ones the light mode's.
 */
export function baseMode(settings: ThemeSettings): 'light' | 'dark' {
  return luminance(settings.colors.background) < 0.2 ? 'dark' : 'light';
}

/**
 * The theme as CSS. The site's colours are the tokens Paper (light background, dark text in
 * dark mode) and Ink; the theme sets them for its base mode, so every page and app follows.
 * Unlayered rules win over Tailwind's utilities, so element fonts apply even where a class
 * sets one (e.g. headings in the brand font).
 */
export function themeCss(settings: ThemeSettings): string {
  const { background, text, accent } = settings.colors;
  const dark = baseMode(settings) === 'dark';
  const root = ':root[data-custom-theme]';
  const rules = [
    `${root}{--dq-paper:${dark ? text : background};--dq-ink:${dark ? background : text};--dq-quake:${accent};--dq-theme-bg:${background};--dq-theme-text:${text};color-scheme:${dark ? 'dark' : 'light'}}`,
    `${root} body{background-color:var(--dq-theme-bg);color:var(--dq-theme-text)}`,
  ];
  for (const target of FONT_TARGETS) {
    const font = settings.fonts[target];
    if (!font) continue;
    const selectors = TARGET_SELECTORS[target]
      .split(', ')
      .map((s) => `${root} ${s}`)
      .join(',');
    rules.push(`${selectors}{font-family:${FONT_CHOICES[font]}}`);
  }
  return rules.join('\n');
}

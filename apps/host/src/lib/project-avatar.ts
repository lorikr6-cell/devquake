// Generated project logos ("avatars"): initials from the project name on a coloured tile, with
// a small symbol. Colour and symbol are automatic unless an admin (or the project's manager)
// picked one. Pure: used on the server and in the live preview of the editor.

import type { ProjectSymbol } from '@/components/icons';

export const PROJECT_SYMBOLS = [
  'sparkles',
  'cart',
  'receipt',
  'wallet',
  'target',
  'calendar',
  'chart',
  'book',
  'music',
  'game',
  'dumbbell',
  'utensils',
  'plane',
  'car',
  'home',
  'camera',
  'chat',
  'graduation',
  'check',
  'code',
  'pin',
  'leaf',
  'users',
  'heart',
  'star',
  'bolt',
] as const satisfies readonly ProjectSymbol[];

export const PROJECT_SYMBOL_LABELS: Record<ProjectSymbol, string> = {
  sparkles: 'Sparkles (general)',
  cart: 'Shopping cart',
  receipt: 'Receipt / bills',
  wallet: 'Wallet / money',
  target: 'Target / darts',
  calendar: 'Calendar',
  chart: 'Chart / statistics',
  book: 'Book / notes',
  music: 'Music',
  game: 'Game',
  dumbbell: 'Sport / fitness',
  utensils: 'Food / recipes',
  plane: 'Travel',
  car: 'Car',
  home: 'Home',
  camera: 'Photos',
  chat: 'Chat / community',
  graduation: 'Learning',
  check: 'Tasks',
  code: 'Code / developers',
  pin: 'Places / maps',
  leaf: 'Nature / garden',
  users: 'People / family',
  heart: 'Health / favourites',
  star: 'Star',
  bolt: 'Energy / fast',
};

/** Tile colours picked automatically (stable per project): all carry white text at 4.5:1+. */
export const AUTO_COLORS = [
  '#C8431C', // deep Quake orange
  '#2A62CC',
  '#127A65',
  '#7A4FD6',
  '#C23B6B',
  '#9A6516',
  '#2B7A52',
  '#3B5B8C',
  '#8C4A2F',
  '#0C6E8A',
] as const;

const SMALL_WORDS = new Set([
  'a',
  'an',
  'and',
  'the',
  'of',
  'for',
  'to',
  'in',
  'on',
  'with',
  'my',
  'de',
  'si',
  'și',
  'la',
  'cu',
  'pe',
  'din',
  'pentru',
]);

/**
 * Up to 3 letters from the project name: the first letter of each word ("Shared shopping
 * lists" → "SSL"), camelCase counts as words ("DevQuake" → "DQ"), small words are skipped when
 * others remain ("Bills and receipts" → "BR"), and a single word gives two letters ("Darts" →
 * "Da"). Longer names are cut after the third letter.
 */
export function projectInitials(name: string): string {
  const words = name
    .replace(/([\p{Ll}\d])(\p{Lu})/gu, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  if (words.length === 0) return '?';
  const meaningful = words.filter((w) => !SMALL_WORDS.has(w.toLocaleLowerCase()));
  const used = meaningful.length ? meaningful : words;
  if (used.length === 1) {
    const [first = '', second = ''] = Array.from(used[0]!);
    return first.toLocaleUpperCase() + second.toLocaleLowerCase();
  }
  return used
    .slice(0, 3)
    .map((w) => Array.from(w)[0]!.toLocaleUpperCase())
    .join('');
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The automatic tile colour: stable for a project (by its slug, or name). */
export function autoColor(key: string): string {
  return AUTO_COLORS[hash(key.toLowerCase()) % AUTO_COLORS.length]!;
}

// First match wins, so specific topics come before general ones. Accents are ignored.
const KEYWORDS: Array<[ProjectSymbol, RegExp]> = [
  ['cart', /shop|cart|grocer|market|cumpar|magazin|lista de/],
  ['receipt', /bill|invoice|receipt|factur|utilit/],
  ['wallet', /budget|money|expense|wallet|financ|bani|cheltuiel|salary|bank/],
  ['target', /dart|target|goal|aim|tinta/],
  ['utensils', /recipe|food|cook|meal|reteta|mancare|restaurant/],
  ['dumbbell', /fitness|gym|workout|sport|train|exercise/],
  ['heart', /health|medic|doctor|sanatate|care/],
  ['plane', /travel|trip|flight|vacation|holiday|calatori/],
  ['car', /car\b|cars|drive|fuel|masina|auto\b|vehicle/],
  ['home', /home|house|casa|apartment|rent/],
  ['camera', /photo|camera|picture|poza|gallery/],
  ['music', /music|song|playlist|muzica|band/],
  ['game', /game|play|joc|quiz|puzzle/],
  ['graduation', /learn|school|course|study|lesson|scoala|invat/],
  ['book', /book|read|note|journal|diary|carte|blog/],
  ['calendar', /calendar|event|schedule|booking|appointment|program/],
  ['chart', /stat|chart|analytic|report|dashboard|metric/],
  ['check', /task|todo|to-do|check|habit/],
  ['chat', /chat|message|forum|social|community|comment/],
  ['pin', /map|location|place|route|harta/],
  ['leaf', /plant|garden|green|eco|nature|gradina/],
  ['users', /people|team|friend|family|group|familie|prieten/],
  ['code', /code|developer|\bdev\b|\bapi\b|program/],
  ['bolt', /energy|power|fast|quick|electric/],
];

/** A symbol that fits the project, guessed from its name, app id and description. */
export function autoSymbol(...texts: Array<string | null | undefined>): ProjectSymbol {
  const text = texts
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
  return KEYWORDS.find(([, re]) => re.test(text))?.[0] ?? 'sparkles';
}

export const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);

export const isProjectSymbol = (value: unknown): value is ProjectSymbol =>
  typeof value === 'string' && (PROJECT_SYMBOLS as readonly string[]).includes(value);

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG contrast ratio of two colours (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** White or ink text on the tile, whichever contrasts more. */
export function textColorOn(background: string): '#FFFFFF' | '#16181D' {
  return contrastRatio(background, '#FFFFFF') >= contrastRatio(background, '#16181D')
    ? '#FFFFFF'
    : '#16181D';
}

export interface ProjectAvatarInput {
  name: string;
  slug?: string | null;
  pluginId?: string | null;
  description?: string | null;
  /** Chosen colour, or null for the automatic one. */
  color?: string | null;
  /** Chosen symbol, or null for the automatic one. */
  symbol?: string | null;
}

export interface ProjectAvatarLook {
  initials: string;
  background: string;
  foreground: string;
  symbol: ProjectSymbol;
  autoColor: string;
  autoSymbol: ProjectSymbol;
}

export function projectAvatarLook(p: ProjectAvatarInput): ProjectAvatarLook {
  const auto = autoColor(p.slug || p.name);
  const guessed = autoSymbol(p.name, p.pluginId, p.description);
  const background = isHexColor(p.color) ? p.color.toUpperCase() : auto;
  return {
    initials: projectInitials(p.name),
    background,
    foreground: textColorOn(background),
    symbol: isProjectSymbol(p.symbol) ? p.symbol : guessed,
    autoColor: auto,
    autoSymbol: guessed,
  };
}

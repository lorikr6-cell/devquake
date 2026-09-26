// Vault entries: categories, questions and their answers, the vault key's text form, and the
// release rule. Pure: shared by the browser (encryption), the server (checks) and tests.

/** What an entry is about (not secret: shown in lists and the release email). */
export const CATEGORIES = [
  { code: 'note', icon: '📝' },
  { code: 'credentials', icon: '🔑' },
  { code: 'crypto', icon: '🪙' },
  { code: 'finance', icon: '🏦' },
  { code: 'identity', icon: '🪪' },
  { code: 'documents', icon: '📄' },
  { code: 'wishes', icon: '✉️' },
  { code: 'other', icon: '🗂️' },
] as const;
export type Category = (typeof CATEGORIES)[number]['code'];
export const isCategory = (v: unknown): v is Category => CATEGORIES.some((c) => c.code === v);
export const categoryIcon = (code: string) => CATEGORIES.find((c) => c.code === code)?.icon ?? '🗂️';

export const QUESTION_TYPES = ['date', 'text', 'number', 'single', 'multi'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export interface Question {
  prompt: string;
  type: QuestionType;
  /** The choices of single and multi questions (2 to 12). */
  options: string[] | null;
}

export const QUESTIONS_PER_ENTRY = 3;

/** Case, accents and spacing do not matter in text answers ("  Érdi  Anna" = "erdi anna"). */
export function foldText(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The canonical form of an answer, the same in the browser and on the server, or null when it
 * is not a valid answer to the question:
 * date "YYYY-MM-DD"; text folded; number without leading zeros ("007" = "7", "2,5" = "2.5");
 * single the chosen option's index; multi the chosen indexes, sorted, comma separated.
 */
export function normalizeAnswer(question: Question, raw: unknown): string | null {
  switch (question.type) {
    case 'date': {
      if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
      const [y, m, d] = raw.split('-').map(Number) as [number, number, number];
      const date = new Date(Date.UTC(y, m - 1, d));
      return date.getUTCDate() === d && date.getUTCMonth() === m - 1 ? raw : null;
    }
    case 'text': {
      if (typeof raw !== 'string') return null;
      const text = foldText(raw);
      return text ? text : null;
    }
    case 'number': {
      const text = typeof raw === 'number' ? String(raw) : typeof raw === 'string' ? raw : '';
      const clean = text.replace(/\s/g, '').replace(',', '.');
      if (!/^-?\d+(\.\d+)?$/.test(clean)) return null;
      return String(Number(clean));
    }
    case 'single': {
      const n = Number(raw);
      const count = question.options?.length ?? 0;
      return Number.isInteger(n) && n >= 0 && n < count ? String(n) : null;
    }
    case 'multi': {
      if (!Array.isArray(raw)) return null;
      const count = question.options?.length ?? 0;
      const picked = [...new Set(raw.map(Number))].filter(
        (n) => Number.isInteger(n) && n >= 0 && n < count,
      );
      if (picked.length === 0 || picked.length !== raw.length) return null;
      return picked.sort((a, b) => a - b).join(',');
    }
  }
}

/** The three normalised answers as one secret (joined with a character no answer contains). */
export function answersSecret(normalized: string[]): string {
  return normalized.join('\u001f');
}

// --- The vault key: 32 random bytes, written as 52 Crockford base32 characters in groups of 4.

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const VAULT_KEY_BYTES = 32;

export function formatVaultKey(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out.match(/.{1,4}/g)!.join('-');
}

/**
 * The key's bytes from what someone typed: dashes and spaces ignored, lower case accepted, and
 * the letters people confuse (O → 0, I and L → 1). Null when it is not a vault key.
 */
export function parseVaultKey(text: string): Uint8Array | null {
  const clean = text.toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  if (clean.length !== 52 || /[^0-9A-HJKMNP-TV-Z]/.test(clean)) return null;
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of clean) {
    value = (value << 5) | ALPHABET.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return bytes.length >= VAULT_KEY_BYTES ? new Uint8Array(bytes.slice(0, VAULT_KEY_BYTES)) : null;
}

// --- Release rule

export const MIN_INACTIVE_DAYS = 3;
export const MAX_INACTIVE_DAYS = 3650;
/** The owner is warned by email this many days before a release (or earlier for short rules). */
export const WARN_DAYS_BEFORE = 7;

export type ReleaseState =
  | { kind: 'private' }
  | { kind: 'waiting'; releaseAt: string }
  | { kind: 'warn'; releaseAt: string; daysLeft: number }
  | { kind: 'release' };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Where an entry with recipients stands: released when the owner has been inactive for
 * `inactiveDays` (counted from their last activity, and never before the rule was set) AND the
 * `notBefore` day has come; warned in the last days before that.
 */
export function releaseState(args: {
  hasRecipients: boolean;
  inactiveDays: number | null;
  notBefore: string | null;
  ruleSetAt: string | null;
  lastActiveAt: string | null;
  now: Date;
}): ReleaseState {
  if (!args.hasRecipients || !args.inactiveDays) return { kind: 'private' };
  const from = Math.max(
    args.lastActiveAt ? Date.parse(args.lastActiveAt) : 0,
    args.ruleSetAt ? Date.parse(args.ruleSetAt) : 0,
  );
  let releaseAt = from + args.inactiveDays * DAY_MS;
  if (args.notBefore) releaseAt = Math.max(releaseAt, Date.parse(`${args.notBefore}T00:00:00Z`));
  const left = releaseAt - args.now.getTime();
  const iso = new Date(releaseAt).toISOString();
  if (left <= 0) return { kind: 'release' };
  const warnWindow =
    Math.min(WARN_DAYS_BEFORE, Math.max(1, Math.floor(args.inactiveDays / 3))) * DAY_MS;
  if (left <= warnWindow)
    return { kind: 'warn', releaseAt: iso, daysLeft: Math.ceil(left / DAY_MS) };
  return { kind: 'waiting', releaseAt: iso };
}

// --- Attempts

export const MAX_FAILED_ATTEMPTS = 3;
export const LOCK_HOURS = 36;

/** Content limits: the encrypted content, files included. */
export const MAX_CONTENT_BYTES = 6 * 1024 * 1024;
export const MAX_FILES = 10;

/** What an entry holds (encrypted as a whole in the browser). */
export interface VaultContent {
  v: 1;
  note: string;
  secrets: { label: string; value: string }[];
  files: { name: string; type: string; size: number; data: string }[];
}

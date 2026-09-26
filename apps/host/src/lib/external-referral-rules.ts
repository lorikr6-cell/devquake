// External referrals (ADR 0021): partner referral links on the landing page. Pure and tested:
// what the control panel may save, and which texts a visitor sees.

import { LOCALES, type Locale } from '@devquake/ui';

export interface ReferralTexts {
  /** Small caption above the title, e.g. "Crypto exchange". */
  label: string;
  title: string;
  body: string;
  button: string;
}

export type ReferralTextsByLocale = Record<Locale, ReferralTexts>;

export interface ExternalReferralInput {
  slug: string;
  name: string;
  url: string;
  /** Optional code people enter in the partner's app (letters, digits, - and _). */
  code: string | null;
  texts: ReferralTextsByLocale;
  isActive: boolean;
  sortOrder: number;
}

export const TEXT_FIELDS = ['label', 'title', 'body', 'button'] as const;
const MAX: Record<(typeof TEXT_FIELDS)[number], number> = {
  label: 40,
  title: 80,
  body: 300,
  button: 30,
};

export type ReferralError = 'slug' | 'name' | 'url' | 'code' | 'texts';

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

/** Only absolute https links (the redirect never goes anywhere else). */
export function isSafeReferralUrl(value: string): boolean {
  if (value.length > 1000) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' && !url.username && !url.password && url.hostname.includes('.')
    );
  } catch {
    return false;
  }
}

/** Reads the control panel form: every language needs every text (ADR 0011). */
export function parseReferralForm(form: {
  get(name: string): unknown;
}): { ok: true; value: ExternalReferralInput } | { ok: false; error: ReferralError } {
  const str = (name: string) => String(form.get(name) ?? '').trim();
  const slug = str('slug').toLowerCase();
  if (!SLUG.test(slug)) return { ok: false, error: 'slug' };
  const name = str('name').slice(0, 80);
  if (!name) return { ok: false, error: 'name' };
  const url = str('url');
  if (!isSafeReferralUrl(url)) return { ok: false, error: 'url' };
  const code = str('code');
  if (code && !/^[A-Za-z0-9_-]{1,40}$/.test(code)) return { ok: false, error: 'code' };
  const texts = {} as ReferralTextsByLocale;
  for (const locale of LOCALES) {
    const entry = {} as ReferralTexts;
    for (const field of TEXT_FIELDS) {
      const value = str(`${locale}.${field}`).replace(/\s+/g, ' ');
      if (!value || value.length > MAX[field]) return { ok: false, error: 'texts' };
      entry[field] = value;
    }
    texts[locale] = entry;
  }
  const sortOrder = Math.max(0, Math.min(9999, Math.round(Number(str('sort_order')) || 0)));
  return {
    ok: true,
    value: {
      slug,
      name,
      url,
      code: code || null,
      texts,
      isActive: form.get('is_active') === 'on',
      sortOrder,
    },
  };
}

/** Stored texts for a language (English when a language is missing; null when unusable). */
export function textsFor(json: string, locale: Locale): ReferralTexts | null {
  try {
    const all = JSON.parse(json) as Partial<Record<Locale, Partial<ReferralTexts>>>;
    const pick = (l: Locale) => {
      const t = all[l];
      return t && TEXT_FIELDS.every((f) => typeof t[f] === 'string' && t[f])
        ? (t as ReferralTexts)
        : null;
    };
    return pick(locale) ?? pick('en');
  } catch {
    return null;
  }
}

export const REFERRAL_TEXT_MAX = MAX;

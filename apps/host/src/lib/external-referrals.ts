import 'server-only';
import { cache } from 'react';
import type { Locale } from '@devquake/ui';
import { execute, query, queryOne, type Row } from './db';
import {
  textsFor,
  type ExternalReferralInput,
  type ReferralTexts,
  type ReferralTextsByLocale,
} from './external-referral-rules';

/**
 * External referrals (ADR 0021, migration 0020): partner links shown on the landing page. Only
 * counts are kept (clicks), never who clicked.
 */

interface ReferralRow extends Row {
  id: number;
  slug: string;
  name: string;
  url: string;
  referral_code: string | null;
  texts: string;
  is_active: number;
  sort_order: number;
  clicks: number;
}

export interface PublicReferral {
  slug: string;
  name: string;
  /** The partner's domain, shown under the button (e.g. "bitget.com"). */
  host: string;
  /** A code to enter in the partner's app, if it has one. */
  code: string | null;
  texts: ReferralTexts;
}

export interface AdminReferral {
  id: number;
  slug: string;
  name: string;
  url: string;
  code: string | null;
  texts: Partial<ReferralTextsByLocale>;
  isActive: boolean;
  sortOrder: number;
  clicks: number;
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

/** The active referrals in a language (none before migration 0020). */
export const listPublicReferrals = cache(async (locale: Locale): Promise<PublicReferral[]> => {
  const rows = await query<ReferralRow>(
    'SELECT * FROM external_referrals WHERE is_active = 1 ORDER BY sort_order, name',
  ).catch(() => []);
  return rows.flatMap((r) => {
    const texts = textsFor(r.texts, locale);
    return texts
      ? [{ slug: r.slug, name: r.name, host: hostOf(r.url), code: r.referral_code ?? null, texts }]
      : [];
  });
});

const toAdmin = (r: ReferralRow): AdminReferral => {
  let texts: Partial<ReferralTextsByLocale> = {};
  try {
    texts = JSON.parse(r.texts) as Partial<ReferralTextsByLocale>;
  } catch {
    // shown empty in the form
  }
  return {
    id: Number(r.id),
    slug: r.slug,
    name: r.name,
    url: r.url,
    code: r.referral_code ?? null,
    texts,
    isActive: r.is_active === 1,
    sortOrder: Number(r.sort_order),
    clicks: Number(r.clicks),
  };
};

export async function listAllReferrals(): Promise<AdminReferral[]> {
  const rows = await query<ReferralRow>(
    'SELECT * FROM external_referrals ORDER BY sort_order, name',
  );
  return rows.map(toAdmin);
}

export async function getReferral(id: number): Promise<AdminReferral | null> {
  const row = await queryOne<ReferralRow>('SELECT * FROM external_referrals WHERE id = ?', [id]);
  return row ? toAdmin(row) : null;
}

/** Creates (id null) or updates a referral; 'duplicate' when the slug is taken. */
export async function saveReferral(
  id: number | null,
  input: ExternalReferralInput,
): Promise<{ ok: true; id: number } | { ok: false; error: 'duplicate' }> {
  const values = [
    input.slug,
    input.name,
    input.url,
    input.code,
    JSON.stringify(input.texts),
    input.isActive ? 1 : 0,
    input.sortOrder,
  ];
  try {
    if (id) {
      await execute(
        `UPDATE external_referrals SET slug = ?, name = ?, url = ?, referral_code = ?, texts = ?, is_active = ?,
            sort_order = ? WHERE id = ?`,
        [...values, id],
      );
      return { ok: true, id };
    }
    const { insertId } = await execute(
      `INSERT INTO external_referrals (slug, name, url, referral_code, texts, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      values,
    );
    return { ok: true, id: insertId };
  } catch (err) {
    if ((err as { code?: string }).code === 'ER_DUP_ENTRY')
      return { ok: false, error: 'duplicate' };
    throw err;
  }
}

export async function deleteReferral(id: number): Promise<void> {
  await execute('DELETE FROM external_referrals WHERE id = ?', [id]);
}

/** The link behind /go/<slug> (active referrals only), counting the visit. */
export async function followReferral(slug: string): Promise<string | null> {
  const row = await queryOne<Row & { id: number; url: string }>(
    'SELECT id, url FROM external_referrals WHERE slug = ? AND is_active = 1',
    [slug],
  ).catch(() => null);
  if (!row) return null;
  await execute('UPDATE external_referrals SET clicks = clicks + 1 WHERE id = ?', [row.id]).catch(
    () => {},
  );
  return row.url;
}

/** Whether an active referral exists (for its QR code). */
export async function referralExists(slug: string): Promise<boolean> {
  const row = await queryOne<Row & { id: number }>(
    'SELECT id FROM external_referrals WHERE slug = ? AND is_active = 1',
    [slug],
  ).catch(() => null);
  return !!row;
}

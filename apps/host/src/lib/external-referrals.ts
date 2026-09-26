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
  logo_type: string | null;
  has_logo: number;
  /** Changes when the row is saved: versions the logo address. */
  version: number;
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
  /** The partner's logo (top right of the box), if it has one. */
  logoUrl: string | null;
  texts: ReferralTexts;
}

export interface AdminReferral {
  id: number;
  slug: string;
  name: string;
  url: string;
  code: string | null;
  logoUrl: string | null;
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

/** The columns read for lists and forms: never the logo itself. */
const COLUMNS = `id, slug, name, url, referral_code, texts, is_active, sort_order, clicks, logo_type,
  logo IS NOT NULL AS has_logo, UNIX_TIMESTAMP(updated_at) AS version`;

const logoUrl = (r: ReferralRow) =>
  Number(r.has_logo) === 1 ? `/go/${r.slug}/logo?v=${Number(r.version)}` : null;

/** How a save treats the logo. */
export type LogoChange =
  { kind: 'keep' } | { kind: 'remove' } | { kind: 'set'; data: Buffer; type: string };

/** The active referrals in a language (none before migration 0020). */
export const listPublicReferrals = cache(async (locale: Locale): Promise<PublicReferral[]> => {
  const rows = await query<ReferralRow>(
    `SELECT ${COLUMNS} FROM external_referrals WHERE is_active = 1 ORDER BY sort_order, name`,
  ).catch(() => []);
  return rows.flatMap((r) => {
    const texts = textsFor(r.texts, locale);
    return texts
      ? [
          {
            slug: r.slug,
            name: r.name,
            host: hostOf(r.url),
            code: r.referral_code ?? null,
            logoUrl: logoUrl(r),
            texts,
          },
        ]
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
    logoUrl: logoUrl(r),
    texts,
    isActive: r.is_active === 1,
    sortOrder: Number(r.sort_order),
    clicks: Number(r.clicks),
  };
};

export async function listAllReferrals(): Promise<AdminReferral[]> {
  const rows = await query<ReferralRow>(
    `SELECT ${COLUMNS} FROM external_referrals ORDER BY sort_order, name`,
  );
  return rows.map(toAdmin);
}

export async function getReferral(id: number): Promise<AdminReferral | null> {
  const row = await queryOne<ReferralRow>(
    `SELECT ${COLUMNS} FROM external_referrals WHERE id = ?`,
    [id],
  );
  return row ? toAdmin(row) : null;
}

/** Creates (id null) or updates a referral; 'duplicate' when the slug is taken. */
export async function saveReferral(
  id: number | null,
  input: ExternalReferralInput,
  logo: LogoChange = { kind: 'keep' },
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
      await saveLogo(id, logo);
      return { ok: true, id };
    }
    const { insertId } = await execute(
      `INSERT INTO external_referrals (slug, name, url, referral_code, texts, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      values,
    );
    await saveLogo(insertId, logo);
    return { ok: true, id: insertId };
  } catch (err) {
    if ((err as { code?: string }).code === 'ER_DUP_ENTRY')
      return { ok: false, error: 'duplicate' };
    throw err;
  }
}

async function saveLogo(id: number, logo: LogoChange): Promise<void> {
  if (logo.kind === 'remove') {
    await execute('UPDATE external_referrals SET logo = NULL, logo_type = NULL WHERE id = ?', [id]);
  } else if (logo.kind === 'set') {
    await execute('UPDATE external_referrals SET logo = ?, logo_type = ? WHERE id = ?', [
      logo.data,
      logo.type,
      id,
    ]);
  }
}

/** A referral's logo for /go/<slug>/logo, or null. */
export async function getReferralLogo(
  slug: string,
): Promise<{ data: Buffer; type: string } | null> {
  const row = await queryOne<Row & { logo: Buffer | null; logo_type: string | null }>(
    'SELECT logo, logo_type FROM external_referrals WHERE slug = ?',
    [slug],
  ).catch(() => null);
  return row?.logo && row.logo_type ? { data: row.logo, type: row.logo_type } : null;
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

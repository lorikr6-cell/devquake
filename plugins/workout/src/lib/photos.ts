import { HttpError } from './http';

// Progress photos (ADR 0015): which files are accepted (checked by content, not by the file
// name), and which period a photo belongs to.

export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
/** The longest side after shrinking in the browser. */
export const PHOTO_MAX_SIDE = 1440;

export type PhotoMime = 'image/jpeg' | 'image/png' | 'image/webp';
export const PHOTO_KINDS = ['start', 'month', 'year'] as const;
export type PhotoKind = (typeof PHOTO_KINDS)[number];

/** The image type from the first bytes, or null for anything that is not JPEG, PNG or WebP. */
export function sniffPhoto(bytes: Uint8Array): PhotoMime | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  return null;
}

/**
 * The stored period (a DATE) of a photo: a month "2026-09" → 2026-09-01, a year "2026" →
 * 2026-01-01; the starting photo is dated `today`.
 */
export function photoPeriod(
  kind: string,
  period: string,
  today: string,
): { kind: PhotoKind; period: string } {
  const year = (y: string) => {
    const n = Number(y);
    if (!Number.isInteger(n) || n < 2000 || n > 2100) throw new HttpError(400, 'invalidRequest');
    return y;
  };
  if (kind === 'start') return { kind, period: today };
  if (kind === 'year' && /^\d{4}$/.test(period)) return { kind, period: `${year(period)}-01-01` };
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (kind === 'month' && m && Number(m[2]) >= 1 && Number(m[2]) <= 12) {
    return { kind, period: `${year(m[1]!)}-${m[2]}-01` };
  }
  throw new HttpError(400, 'invalidRequest');
}

/** Address of a photo; `version` changes when it is replaced (browser cache). */
export function photoUrl(id: number, version: string): string {
  return `/api/photos/${id}?v=${encodeURIComponent(version)}`;
}

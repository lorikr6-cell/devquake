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

/** Days before the end of a month when the app asks for that month's photo. */
export const MONTH_END_DAYS = 3;
/** Days into a new month when last month's photo can still be added from the Progress page. */
export const LATE_MONTH_DAYS = 7;

const pad2 = (n: number) => String(n).padStart(2, '0');

export interface MonthPhotoWindow {
  /** "YYYY-MM" of `today`. */
  month: string;
  /** Days left in the month after today (0 on the last day). */
  daysLeft: number;
  /** In the last MONTH_END_DAYS days of the month: time for the month's photo. */
  monthEnd: boolean;
  /** "YYYY-MM" of last month during the first LATE_MONTH_DAYS days, otherwise null. */
  lateMonth: string | null;
}

/** Which monthly photos to offer on `today` ("YYYY-MM-DD", the person's own day). */
export function monthPhotoWindow(today: string): MonthPhotoWindow {
  const [y, m, d] = today.split('-').map(Number) as [number, number, number];
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const daysLeft = lastDay - d;
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${pad2(m - 1)}`;
  return {
    month: today.slice(0, 7),
    daysLeft,
    monthEnd: daysLeft < MONTH_END_DAYS,
    lateMonth: d <= LATE_MONTH_DAYS ? prev : null,
  };
}

/** Whole months from the starting photo's day to a later photo's period (never negative). */
export function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number) as [number, number];
  const [ty, tm] = to.split('-').map(Number) as [number, number];
  return Math.max(0, (ty - fy) * 12 + (tm - fm));
}

/**
 * The comparison on the Progress page: the starting photo stays fixed and the other photos
 * (months and years, oldest first) can be stepped through. Without a starting photo the oldest
 * photo is the fixed one. Null when there is nothing to compare.
 */
export function comparisonSeries<P extends { kind: PhotoKind; period: string }>(
  photos: P[],
): { base: P; others: P[] } | null {
  const sorted = [...photos].sort(
    (a, b) =>
      a.period.localeCompare(b.period) || PHOTO_KINDS.indexOf(a.kind) - PHOTO_KINDS.indexOf(b.kind),
  );
  const base = sorted.find((p) => p.kind === 'start') ?? sorted[0];
  if (!base) return null;
  const others = sorted.filter((p) => p !== base);
  return others.length ? { base, others } : null;
}

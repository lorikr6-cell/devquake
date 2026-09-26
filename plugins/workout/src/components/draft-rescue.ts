'use client';

/**
 * Keeping unsaved work when the sign-in has ended (ADR 0014, follow-up). A save that answers 401
 * stores the form on this device; after signing in again the same page restores it. Drafts
 * older than a day are dropped.
 */

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function isSignedOut(err: unknown): boolean {
  return (err as { status?: number } | null)?.status === 401;
}

export function keepDraft(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), value }));
  } catch {
    // storage unavailable (private mode): nothing kept
  }
}

/** The kept draft (removed once taken), or null. */
export function takeDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    localStorage.removeItem(key);
    const { at, value } = JSON.parse(raw) as { at: number; value: T };
    return Date.now() - at < MAX_AGE_MS ? value : null;
  } catch {
    return null;
  }
}

/** DevQuake's sign-in, coming back to this very page afterwards. */
export function signInHref(hostUrl: string): string {
  return `${hostUrl}/?next=${encodeURIComponent(window.location.href)}#account`;
}

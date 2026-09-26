'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';

/**
 * A slim bar at the bottom of the toolbar while the site is waiting for the server, so a click
 * never seems to do nothing. It counts the page's own requests (data, server actions, page
 * changes, router.refresh) by wrapping window.fetch once, and starts at once on a click on an
 * internal link until the page has changed. Next's background prefetches and requests marked
 * with the header `x-dq-background: 1` are not counted. Shown only after a short delay, so
 * quick answers do not flash.
 */

const SHOW_AFTER_MS = 120;
/** A link click that never changes the page (same page, cancelled) stops counting after this. */
const NAVIGATION_TIMEOUT_MS = 10_000;

let pending = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const change = (delta: number) => {
  pending = Math.max(0, pending + delta);
  emit();
};

function headerOf(input: RequestInfo | URL, init: RequestInit | undefined, name: string) {
  const fromInit = init?.headers ? new Headers(init.headers).get(name) : null;
  if (fromInit !== null) return fromInit;
  return input instanceof Request ? input.headers.get(name) : null;
}

/** Wraps window.fetch once per page load (every mounted bar shares the count). */
function installFetchCounter() {
  const w = window as typeof window & { __dqFetchCounted?: boolean };
  if (w.__dqFetchCounted) return;
  w.__dqFetchCounted = true;
  const original = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const background =
      headerOf(input, init, 'next-router-prefetch') !== null ||
      headerOf(input, init, 'x-dq-background') === '1';
    if (background) return original(input, init);
    change(1);
    try {
      return await original(input, init);
    } finally {
      change(-1);
    }
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** A click that will load another page of this site (not a new tab, download or anchor). */
function isInternalNavigation(event: MouseEvent): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const link = (event.target as Element | null)?.closest?.('a');
  if (!link || !link.href || link.hasAttribute('download')) return false;
  if (link.target && link.target !== '_self') return false;
  const to = new URL(link.href, window.location.href);
  if (to.origin !== window.location.origin) return false;
  return to.pathname !== window.location.pathname || to.search !== window.location.search;
}

export function NetworkProgress({ label }: { label: string }) {
  const busyRequests = useSyncExternalStore(
    subscribe,
    () => pending > 0,
    () => false,
  );
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [navigating, setNavigating] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    installFetchCounter();
    const onClick = (event: MouseEvent) => {
      if (isInternalNavigation(event)) setNavigating(true);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // The page changed: the navigation is done.
  useEffect(() => setNavigating(false), [pathname, search]);

  useEffect(() => {
    if (!navigating) return;
    const timer = setTimeout(() => setNavigating(false), NAVIGATION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [navigating]);

  const busy = busyRequests || navigating;
  useEffect(() => {
    if (!busy) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [busy]);

  if (!visible) return null;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-busy="true"
      className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 overflow-hidden bg-quake/15"
    >
      <div className="dq-progress-bar h-full w-1/3 bg-quake" />
    </div>
  );
}

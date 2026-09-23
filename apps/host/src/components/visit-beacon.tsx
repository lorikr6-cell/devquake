'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Last path counted: one beacon per page even if the effect runs twice (React dev mode).
let lastCounted: string | null = null;

/**
 * Sends one anonymous, cookie-free page-view beacon per page (root domain only, never the
 * control panel). Counting happens server-side in src/lib/visits.ts.
 */
export function VisitBeacon({ rootHostname }: { rootHostname: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (location.hostname !== rootHostname || pathname.startsWith('/admin-cp')) return;
    if (lastCounted === pathname) return;
    lastCounted = pathname;
    try {
      navigator.sendBeacon?.('/api/visit');
    } catch {
      /* counting is best-effort */
    }
  }, [pathname, rootHostname]);

  return null;
}

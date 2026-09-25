'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TZ_COOKIE, TZ_COOKIE_MAX_AGE } from '@/lib/timezone';

/**
 * Tells the server the visitor's time zone (ADR 0010): stores the browser's IANA zone in a
 * cookie shared by devquake.com and every app subdomain, and re-renders the page once when it
 * was unknown or changed (first visit, travelling), so all dates show in local time.
 */
export function TimeZoneSync({
  serverZone,
  rootHostname,
}: {
  serverZone: string;
  rootHostname: string;
}) {
  const router = useRouter();
  useEffect(() => {
    let zone: string | undefined;
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (!zone || zone === serverZone) return;
    const host = location.hostname;
    const shared =
      host === rootHostname || host.endsWith(`.${rootHostname}`)
        ? rootHostname === 'localhost'
          ? ''
          : `; domain=.${rootHostname}`
        : '';
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${TZ_COOKIE}=${encodeURIComponent(zone)}; Max-Age=${TZ_COOKIE_MAX_AGE}; path=/; SameSite=Lax${shared}${secure}`;
    router.refresh();
  }, [serverZone, rootHostname, router]);
  return null;
}

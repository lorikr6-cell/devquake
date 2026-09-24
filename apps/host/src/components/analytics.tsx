'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { contentGroup } from '@/lib/content-group';
import { GA_MEASUREMENT_ID } from '@/lib/legal';

const CONSENT_COOKIE = 'dq_consent';
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180; // ask again after ~6 months
const OPEN_EVENT = 'dq:open-cookie-settings';
type Consent = 'granted' | 'denied';

/** ".devquake.com" so one answer covers every plugin subdomain (host-only on localhost). */
function cookieDomain(): string {
  const parts = location.hostname.split('.');
  return parts.length >= 2 && !/^\d+$/.test(parts.at(-1)!) && parts.at(-1) !== 'localhost'
    ? `; domain=.${parts.slice(-2).join('.')}`
    : '';
}

function readConsent(): Consent | null {
  const m = document.cookie.match(/(?:^|;\s*)dq_consent=(granted|denied)/);
  return (m?.[1] as Consent | undefined) ?? null;
}

function writeConsent(value: Consent) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${CONSENT_MAX_AGE}; path=/; SameSite=Lax${cookieDomain()}${secure}`;
}

/** Removes GA cookies on this host and its parent domain (GA sets them on .devquake.com). */
function clearGaCookies() {
  const host = location.hostname;
  const domains = [host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`];
  for (const name of document.cookie.split(';').map((c) => c.split('=')[0]!.trim())) {
    if (!name.startsWith('_ga')) continue;
    for (const d of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${d}`;
    }
    document.cookie = `${name}=; Max-Age=0; path=/`;
  }
}

/** Lets any page (e.g. the footer) reopen the consent banner. */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/**
 * Google Analytics with consent first (GDPR / Google Consent Mode v2, "basic"): nothing from
 * Google loads until the visitor accepts. Advertising storage is always denied. Never runs in
 * the control panel. Every page view and event carries its app as `content_group`; apps send
 * their own events with `trackEvent()` from `@devquake/ui`.
 */
export function Analytics({
  privacyUrl,
  rootHostname,
}: {
  privacyUrl: string;
  rootHostname: string;
}) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [group, setGroup] = useState('site');

  useEffect(() => {
    const stored = readConsent();
    setGroup(contentGroup(location.hostname, rootHostname));
    setConsent(stored);
    setBannerOpen(stored === null);
    setReady(true);
    const open = () => setBannerOpen(true);
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, [rootHostname]);

  if (!ready || pathname.startsWith('/admin-cp')) return null;

  const decide = (value: Consent) => {
    writeConsent(value);
    setConsent(value);
    setBannerOpen(false);
    // GA's official opt-out flag; switched back off if the visitor accepts later.
    (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] =
      value === 'denied';
    if (value === 'denied') clearGaCookies();
  };

  return (
    <>
      {consent === 'granted' && (
        <>
          <Script id="gtag-consent" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  analytics_storage: 'granted',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});
gtag('js', new Date());
gtag('set', { content_group: '${group}' });
gtag('config', '${GA_MEASUREMENT_ID}', { content_group: '${group}' });`}
          </Script>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
        </>
      )}

      {bannerOpen && (
        <div
          role="dialog"
          aria-label="Cookie preferences"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-lg border border-ink/15 bg-white p-4 text-sm text-ink shadow-lg sm:p-5 dark:border-paper/15 dark:bg-ink dark:text-paper"
        >
          <p className="font-semibold">Can we measure how the site is used?</p>
          <p className="mt-1 text-ink/70 dark:text-paper/70">
            With your permission we use Google Analytics cookies to count visits and see which pages
            are useful. No advertising cookies. You can change this any time under “Cookie settings”
            at the bottom of the page.{' '}
            <a href={privacyUrl} className="underline decoration-quake/50 underline-offset-2">
              Privacy policy
            </a>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => decide('granted')}
              className="rounded-md bg-ink px-4 py-2 font-medium text-paper hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none dark:bg-paper dark:hover:bg-paper/85 dark:text-ink"
            >
              Accept analytics
            </button>
            <button
              type="button"
              onClick={() => decide('denied')}
              className="rounded-md border border-ink/20 px-4 py-2 font-medium hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none dark:border-paper/20 dark:hover:bg-paper/10"
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </>
  );
}

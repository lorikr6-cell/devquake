import type { Metadata, Viewport } from 'next';
import { I18nProvider, localizePath } from '@devquake/ui';
import { Bricolage_Grotesque } from 'next/font/google';
import type { ReactNode } from 'react';
import { Analytics } from '@/components/analytics';
import { TimeZoneSync } from '@/components/time-zone-sync';
import { VisitBeacon } from '@/components/visit-beacon';
import { getRootHostname, hostUrl } from '@/lib/domain';
import { PRIVACY_PATH } from '@/lib/legal';
import { getCustomTheme, getTheme } from '@/lib/theme-server';
import { baseMode, themeCss } from '@/lib/custom-theme';
import { customThemeId } from '@/lib/theme';
import './theme-fonts';
import { getTimeZone } from '@/lib/timezone-server';
import { clientCatalog } from '@/i18n/catalog';
import { getLocale, getT } from '@/i18n/server';
import './globals.css';

// Brand display font, exposed as --font-bricolage and used via --font-brand (globals.css).
const brandFont = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['800'],
  variable: '--font-bricolage',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return {
    // Resolves relative canonical / Open Graph URLs to https://devquake.com.
    metadataBase: new URL(hostUrl()),
    title: { default: 'DevQuake', template: '%s · DevQuake' },
    description: t('siteDescription'),
    applicationName: 'DevQuake',
  };
}

export const viewport: Viewport = {
  themeColor: '#16181D',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Chosen theme is rendered by the server (no flash); "adaptive" leaves it to the device.
  const [theme, timeZone, locale] = await Promise.all([getTheme(), getTimeZone(), getLocale()]);
  // A member's custom theme (ADR 0017) builds on the light or dark mode and sets its colours
  // and fonts with a small stylesheet; unusable ones fall back to Adaptive.
  const custom = await getCustomTheme(theme);
  const dataTheme = custom
    ? baseMode(custom)
    : theme === 'light' || theme === 'dark'
      ? theme
      : undefined;
  return (
    <html
      lang={locale}
      className={brandFont.variable}
      data-theme={dataTheme}
      data-custom-theme={custom ? String(customThemeId(theme)) : undefined}
      // The picker changes data-theme on the client; the server value may differ afterwards.
      suppressHydrationWarning
    >
      <head>
        {/* Only validated colours and font ids reach this CSS (lib/custom-theme.ts). */}
        <style
          id="dq-custom-theme"
          dangerouslySetInnerHTML={{ __html: custom ? themeCss(custom) : '' }}
        />
      </head>
      <body className="min-h-screen bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        {/* Texts for client components in the page language (ADR 0011); apps add their own. */}
        <I18nProvider
          locale={locale}
          messages={clientCatalog(locale)}
          fallback={clientCatalog('en')}
        >
          {children}
          {/* Absolute URL: the banner also shows on plugin subdomains. */}
          <Analytics
            privacyUrl={`${hostUrl()}${localizePath(PRIVACY_PATH, locale)}`}
            rootHostname={getRootHostname()}
          />
        </I18nProvider>
        <VisitBeacon rootHostname={getRootHostname()} />
        <TimeZoneSync serverZone={timeZone} rootHostname={getRootHostname()} />
      </body>
    </html>
  );
}

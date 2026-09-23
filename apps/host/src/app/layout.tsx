import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import type { ReactNode } from 'react';
import { Analytics } from '@/components/analytics';
import { VisitBeacon } from '@/components/visit-beacon';
import { getRootHostname, hostUrl } from '@/lib/domain';
import { PRIVACY_PATH } from '@/lib/legal';
import './globals.css';

// Brand display font, exposed as --font-bricolage and used via --font-brand (globals.css).
const brandFont = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['800'],
  variable: '--font-bricolage',
  display: 'swap',
});

export const metadata: Metadata = {
  // Resolves relative canonical / Open Graph URLs to https://devquake.com.
  metadataBase: new URL(hostUrl()),
  title: { default: 'DevQuake', template: '%s · DevQuake' },
  description:
    'A personal, non-commercial workshop of web apps built to solve everyday problems, open to anyone who finds them useful.',
  applicationName: 'DevQuake',
};

export const viewport: Viewport = {
  themeColor: '#16181D',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={brandFont.variable}>
      <body className="min-h-screen bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        {children}
        {/* Absolute URL: the banner also shows on plugin subdomains. */}
        <Analytics privacyUrl={`${hostUrl()}${PRIVACY_PATH}`} />
        <VisitBeacon rootHostname={getRootHostname()} />
      </body>
    </html>
  );
}

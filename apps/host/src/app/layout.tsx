import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

// Brand display font, exposed as --font-bricolage and used via --font-brand (globals.css).
const brandFont = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['800'],
  variable: '--font-bricolage',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'DevQuake', template: '%s · DevQuake' },
  description: 'DevQuake platform',
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
      </body>
    </html>
  );
}

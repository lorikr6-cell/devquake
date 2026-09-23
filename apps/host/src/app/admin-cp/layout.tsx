import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// The admin panel is reachable only by typing /admin-cp: never linked, never indexed.
// next.config.ts also sends X-Robots-Tag, no-store and anti-framing headers for these paths.
export const metadata: Metadata = {
  title: { default: 'Control panel', template: '%s · Control panel' },
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  // Brand surfaces (docs/brand.md): Paper in light mode, Ink in dark mode.
  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">{children}</div>
  );
}

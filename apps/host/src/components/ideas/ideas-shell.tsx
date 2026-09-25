import Link from 'next/link';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { hostUrl } from '@/lib/domain';
import { VotingExplained } from './voting-explained';

export function IdeasShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">{children}</main>
      <SiteFooter />
    </div>
  );
}

/** Ideas are for members: signed-out visitors get the explanation and a way in. */
export function IdeasSignIn({ path }: { path: string }) {
  const next = encodeURIComponent(`${hostUrl()}${path}`);
  return (
    <IdeasShell>
      <h1 className="font-display text-3xl tracking-tight">Ideas from the community</h1>
      <p className="mt-3 max-w-prose text-ink/80 dark:text-paper/80">
        Members share ideas for new apps and for improving existing ones, vote for the ones they
        want and discuss them.
      </p>
      <div className="mt-6">
        <VotingExplained compact />
      </div>
      <Link
        href={`/?next=${next}#account`}
        className="mt-6 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/85 dark:bg-paper dark:text-ink"
      >
        Sign in to see and share ideas
      </Link>
    </IdeasShell>
  );
}

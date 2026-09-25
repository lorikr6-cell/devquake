import { Link, buttonClass, localizePath } from '@devquake/ui';
import { getLocale, getT } from '@/i18n/server';
import type { ReactNode } from 'react';
import { PlatformShell } from '@/components/account/account-shell';
import { hostUrl } from '@/lib/domain';
import { VotingExplained } from './voting-explained';

export function IdeasShell({ children }: { children: ReactNode }) {
  return <PlatformShell width="max-w-4xl">{children}</PlatformShell>;
}

/** Ideas are for members: signed-out visitors get the explanation and a way in. */
export async function IdeasSignIn({ path }: { path: string }) {
  const [t, tl, locale] = await Promise.all([
    getT('ideas.signIn'),
    getT('ideas.list'),
    getLocale(),
  ]);
  const next = encodeURIComponent(`${hostUrl()}${localizePath(path, locale)}`);
  return (
    <IdeasShell>
      <h1 className="font-display text-3xl tracking-tight">{tl('title')}</h1>
      <p className="mt-3 max-w-prose text-ink/80 dark:text-paper/80">{t('intro')}</p>
      <div className="mt-6">
        <VotingExplained compact />
      </div>
      <Link href={`/?next=${next}#account`} className={buttonClass('primary', 'mt-6')}>
        {t('button')}
      </Link>
    </IdeasShell>
  );
}

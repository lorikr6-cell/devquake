import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, buttonClass, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { entryStatus } from '../components/status';
import { Panel } from '../components/ui';
import { ownEntries, sharedWithMe, type EntrySummary } from '../lib/data';
import { categoryIcon } from '../lib/model';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.home') };
}

/** The vault: your entries (with their state) and the entries released to you. */
export default async function Home({ ctx }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user } = scope;
  const locale = localeOf(ctx);
  const t = translator(locale, 'home');
  const tStatus = translator(locale, 'status');
  const tz = ctx.timeZone ?? 'UTC';
  const [own, shared] = await Promise.all([ownEntries(db, user.id), sharedWithMe(db, user.id)]);

  const row = (e: EntrySummary, href: string, byOwner: boolean) => {
    const status = entryStatus(e, tStatus, tz, locale);
    return (
      <li key={e.id}>
        <Link
          href={href}
          className="flex items-start gap-3 rounded-xl border border-ink/10 bg-white/70 p-4 hover:border-quake dark:border-paper/10 dark:bg-paper/5"
        >
          <span aria-hidden className="text-2xl">
            {categoryIcon(e.category)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{e.title}</span>
            <span className="block text-xs text-ink/60 dark:text-paper/60">
              {byOwner
                ? t('from', { name: e.ownerName })
                : t('created', { date: formatDateTime(e.createdAt, tz, 'long-date', locale) })}
            </span>
            <span className="mt-1 block text-sm">
              <span aria-hidden>{status.icon} </span>
              {status.text}
            </span>
          </span>
        </Link>
      </li>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
          <p className="mt-1 max-w-prose text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
        </div>
        <Link href="/new" className={buttonClass('primary', 'min-h-11')}>
          {t('new')}
        </Link>
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">{t('yours')}</h2>
        {own.length === 0 ? (
          <Panel>
            <p className="text-sm text-ink/70 dark:text-paper/70">{t('empty')}</p>
          </Panel>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {own.map((e) => row(e, `/entries/${e.id}`, false))}
          </ul>
        )}
      </section>

      {shared.length ? (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">{t('shared')}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {shared.map((e) => row(e, `/open/${e.id}`, true))}
          </ul>
        </section>
      ) : null}

      <Panel className="text-sm text-ink/70 dark:text-paper/70">
        <p className="font-medium text-ink dark:text-paper">{t('howTitle')}</p>
        <p className="mt-1">{t('howBody')}</p>
      </Panel>
    </div>
  );
}

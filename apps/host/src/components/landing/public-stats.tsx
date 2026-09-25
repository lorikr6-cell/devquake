import { LOCALE_TAGS } from '@devquake/ui';
import { getLocale, getT } from '@/i18n/server';
import type { PublicStats } from '@/lib/visits';

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 dark:border-paper/10 dark:bg-paper/5">
      <p className="text-sm text-ink/70 dark:text-paper/70">{label}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{note}</p>}
    </div>
  );
}

/** Public, aggregate-only numbers: visitors (cookie-free), accounts, projects and ideas. */
export async function PublicStatsSection({ stats }: { stats: PublicStats }) {
  const [t, locale] = await Promise.all([getT('landing.stats'), getLocale()]);
  const fmt = new Intl.NumberFormat(LOCALE_TAGS[locale]);
  const max = Math.max(1, ...stats.daily.map((d) => d.visitors));
  const day = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString(LOCALE_TAGS[locale], {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });

  return (
    <section aria-labelledby="stats-title" className="mt-20">
      <h2 id="stats-title" className="font-display text-2xl tracking-tight">
        {t('title')}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Tile label={t('visitorsToday')} value={fmt.format(stats.visitorsToday)} />
        <Tile label={t('visitors30')} value={fmt.format(stats.visitors30)} />
        <Tile
          label={t('visitsTotal')}
          value={fmt.format(stats.visitorsTotal)}
          note={t('pageViews', { count: fmt.format(stats.pageViewsTotal) })}
        />
        <Tile label={t('accounts')} value={fmt.format(stats.accounts)} />
        <Tile
          label={t('active30')}
          value={fmt.format(stats.activeAccounts30)}
          note={t('signedIn')}
        />
        <Tile
          label={t('projects')}
          value={fmt.format(stats.projects)}
          note={t('projectsNote', {
            online: stats.projectsOnline,
            done: stats.ideasDone,
            total: stats.ideasTotal,
          })}
        />
      </div>

      <div className="mt-3 rounded-lg border border-ink/10 bg-white p-4 dark:border-paper/10 dark:bg-paper/5">
        <div className="flex items-baseline justify-between text-sm">
          <p className="font-medium">{t('perDay')}</p>
          <p className="text-xs text-ink/60 dark:text-paper/60">
            {t('lastDays', { count: stats.daily.length })}
          </p>
        </div>
        <div
          role="img"
          aria-label={t('chartLabel', { days: stats.daily.length, total: stats.visitors30 })}
          className="mt-3 flex h-20 items-end gap-[2px] border-b border-ink/15 dark:border-paper/20"
        >
          {stats.daily.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t-[3px] bg-quake group-hover:opacity-80"
                style={{ height: d.visitors ? `${Math.max(4, (d.visitors / max) * 100)}%` : 0 }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded bg-ink px-2 py-1 text-xs whitespace-nowrap text-paper group-hover:block dark:bg-paper dark:text-ink">
                {day(d.day)}: <strong>{d.visitors}</strong>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink/60 dark:text-paper/60">{t('cookieFree')}</p>
      </div>
    </section>
  );
}

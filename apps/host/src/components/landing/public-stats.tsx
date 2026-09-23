import type { PublicStats } from '@/lib/visits';

const fmt = new Intl.NumberFormat('en-GB');

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
export function PublicStatsSection({ stats }: { stats: PublicStats }) {
  const max = Math.max(1, ...stats.daily.map((d) => d.visitors));
  const day = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });

  return (
    <section aria-labelledby="stats-title" className="mt-20">
      <h2 id="stats-title" className="font-display text-2xl tracking-tight">
        DevQuake in numbers
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Tile label="Visitors today" value={fmt.format(stats.visitorsToday)} />
        <Tile label="Visitors, 30 days" value={fmt.format(stats.visitors30)} />
        <Tile
          label="Visits all time"
          value={fmt.format(stats.visitorsTotal)}
          note={`${fmt.format(stats.pageViewsTotal)} page views`}
        />
        <Tile label="Accounts" value={fmt.format(stats.accounts)} />
        <Tile label="Active, 30 days" value={fmt.format(stats.activeAccounts30)} note="signed in" />
        <Tile
          label="Projects"
          value={fmt.format(stats.projects)}
          note={`${stats.projectsOnline} online · ${stats.ideasDone}/${stats.ideasTotal} milestones done`}
        />
      </div>

      <div className="mt-3 rounded-lg border border-ink/10 bg-white p-4 dark:border-paper/10 dark:bg-paper/5">
        <div className="flex items-baseline justify-between text-sm">
          <p className="font-medium">Visitors per day</p>
          <p className="text-xs text-ink/60 dark:text-paper/60">Last {stats.daily.length} days</p>
        </div>
        <div
          role="img"
          aria-label={`Visitors per day over the last ${stats.daily.length} days, ${stats.visitors30} in total`}
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
        <p className="mt-2 text-xs text-ink/60 dark:text-paper/60">
          Counted without cookies: a visitor is recognised for one day only and never stored in a
          way that identifies them.
        </p>
      </div>
    </section>
  );
}

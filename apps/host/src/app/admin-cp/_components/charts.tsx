import type { CountRow } from '@/lib/admin/users';
import { Panel } from './ui';

/**
 * Minimal, dependency-free charts for the statistics page. One series per chart (the title
 * names it, so no legend); Quake orange marks on a recessive baseline; every bar has a native
 * hover tooltip and every chart has a table view.
 */
export function DailyBars({
  title,
  data,
}: {
  title: string;
  data: Array<{ day: string; value: number }>;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  const fmt = (day: string) =>
    new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });

  return (
    <Panel>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="font-display text-2xl tabular-nums">{total}</span>
      </div>
      <p className="text-xs text-ink/60 dark:text-paper/60">Last {data.length} days, UTC</p>

      <div
        className="mt-4 flex h-28 items-end gap-[2px] border-b border-ink/15 dark:border-paper/20"
        role="img"
        aria-label={`${title}: ${total} in the last ${data.length} days`}
      >
        {data.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-[3px] bg-quake transition-opacity group-hover:opacity-80"
              style={{ height: d.value ? `${Math.max(4, (d.value / max) * 100)}%` : 0 }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded bg-ink px-2 py-1 text-xs whitespace-nowrap text-paper group-hover:block dark:bg-paper dark:text-ink">
              {fmt(d.day)}: <strong>{d.value}</strong>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-ink/50 dark:text-paper/50">
        <span>{data[0] && fmt(data[0].day)}</span>
        <span>max {max}</span>
        <span>{data.at(-1) && fmt(data.at(-1)!.day)}</span>
      </div>

      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-ink/60 dark:text-paper/60">Table</summary>
        <table className="mt-2 w-full tabular-nums">
          <tbody>
            {data
              .filter((d) => d.value > 0)
              .map((d) => (
                <tr key={d.day}>
                  <td className="py-0.5">{fmt(d.day)}</td>
                  <td className="py-0.5 text-right">{d.value}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </Panel>
  );
}

/** Ranked horizontal bars with the value printed beside each. */
export function RankedBars({
  title,
  rows,
  empty = 'No data yet.',
}: {
  title: string;
  rows: CountRow[];
  empty?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <Panel>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{empty}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.label} title={`${r.label}: ${r.n}`}>
              <div className="flex justify-between gap-2">
                <span className="truncate">{r.label}</span>
                <span className="text-ink/70 tabular-nums dark:text-paper/70">{r.n}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-ink/10 dark:bg-paper/15">
                <div
                  className="h-full rounded-full bg-quake"
                  style={{ width: `${(r.n / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

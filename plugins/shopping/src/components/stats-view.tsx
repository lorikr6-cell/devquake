import { formatDay, formatMonth } from '../lib/dates';
import { formatMoney } from '../lib/model';
import type { Stats } from '../lib/stats';
import { storeType } from '../lib/store-types';
import { Panel } from './ui';

const muted = 'text-ink/60 dark:text-paper/60';

function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white/70 p-3 dark:border-paper/10 dark:bg-paper/5">
      <p className={`text-xs ${muted}`}>{label}</p>
      <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
      {hint ? <p className={`text-xs ${muted}`}>{hint}</p> : null}
    </div>
  );
}

const price = (value: number | null, currency: string) =>
  value === null ? '—' : formatMoney(value, currency);

/** The Statistics tab: totals, stores, products, months and how often friends joined. */
export function StatsView({ stats }: { stats: Stats }) {
  if (stats.lists === 0) {
    return (
      <Panel>
        <p className={`text-sm ${muted}`}>Statistics appear once you have a list with products.</p>
      </Panel>
    );
  }
  const maxMonth = Math.max(...stats.months.map((m) => m.total), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Figure label="Lists" value={String(stats.lists)} />
        <Figure label="Products" value={String(stats.items)} hint={`${stats.itemsDone} bought`} />
        {stats.money.slice(0, 1).map((m) => (
          <Figure
            key={m.currency}
            label={`Bought (${m.currency})`}
            value={formatMoney(m.bought, m.currency)}
            hint={`of ${formatMoney(m.planned, m.currency)} planned`}
          />
        ))}
        <Figure
          label="Not needed"
          value={String(stats.notNeeded)}
          hint={
            stats.notNeededBought
              ? `${stats.notNeededBought} already bought 🙃`
              : 'none bought in vain'
          }
        />
      </div>

      {stats.notNeededBought > 0 ? (
        <Panel className="bg-ink/5 dark:bg-black/30">
          <h3 className="font-display text-lg font-semibold">
            Bought, but not needed after all{' '}
            <span aria-hidden title="Oh well">
              🙃
            </span>
          </h3>
          <p className={`mt-1 text-sm ${muted}`}>
            Products that were struck out after they had already been bought.{' '}
            {stats.money
              .filter((m) => m.wasted > 0)
              .map((m) => `${formatMoney(m.wasted, m.currency)} spent on them`)
              .join(', ')}
            .
          </p>
          <ul className="mt-2 divide-y divide-ink/5 text-sm dark:divide-paper/10">
            {stats.wastedProducts.map((w) => (
              <li
                key={`${w.name}|${w.unit}|${w.currency}`}
                className="flex justify-between gap-3 py-2"
              >
                <span>
                  <span className="font-medium">{w.name}</span>{' '}
                  <span className={`text-xs ${muted}`}>
                    {w.unit} · {w.times}×
                  </span>
                </span>
                <span className="tabular-nums">{formatMoney(w.amount, w.currency)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel>
        <h3 className="font-display text-lg font-semibold">Friends on your lists</h3>
        <p className={`mt-1 text-sm ${muted}`}>
          How often each person joined your lists. The dots show your {stats.recentLists.length}{' '}
          most recent lists (newest first): filled = they were on it.
        </p>
        {stats.friends.length === 0 ? (
          <p className={`mt-3 text-sm ${muted}`}>
            Nobody else has been on your lists yet. Share a list to shop together.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={`text-left text-xs ${muted}`}>
                <tr>
                  <th className="py-1 pr-3 font-medium">Person</th>
                  <th className="py-1 pr-3 font-medium">Joined</th>
                  <th className="py-1 pr-3 font-medium">Recent lists</th>
                  <th className="py-1 pr-3 font-medium">Added</th>
                  <th className="py-1 pr-3 font-medium">Picked up</th>
                  <th className="py-1 font-medium">Last time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5 dark:divide-paper/10">
                {stats.friends.map((f) => (
                  <tr key={f.userId}>
                    <td className="py-2 pr-3 font-medium">{f.displayName}</td>
                    <td className="py-2 pr-3 whitespace-nowrap tabular-nums">
                      {f.together} of {stats.lists}{' '}
                      <span className={muted}>({Math.round(f.share * 100)}%)</span>
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className="flex gap-1"
                        aria-label={`${f.presence.filter(Boolean).length} of the last ${f.presence.length} lists`}
                      >
                        {f.presence.map((present, i) => (
                          <span
                            key={stats.recentLists[i]!.id}
                            title={`${stats.recentLists[i]!.name} (${stats.recentLists[i]!.shopDate}${stats.recentLists[i]!.deleted ? ', deleted' : ''}): ${present ? 'joined' : 'not on this list'}`}
                            className={`size-2.5 rounded-full ${present ? 'bg-quake' : 'border border-ink/25 dark:border-paper/30'}`}
                          />
                        ))}
                      </span>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{f.itemsAdded}</td>
                    <td className="py-2 pr-3 tabular-nums">{f.itemsPickedUp}</td>
                    <td className="py-2 whitespace-nowrap">
                      {f.lastDate ? formatDay(f.lastDate, 'short') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h3 className="font-display text-lg font-semibold">Stores</h3>
          {stats.stores.length === 0 ? (
            <p className={`mt-2 text-sm ${muted}`}>No products assigned to a store yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-ink/5 text-sm dark:divide-paper/10">
              {stats.stores.map((s) => (
                <li
                  key={`${s.name}|${s.type}|${s.currency}`}
                  className="flex justify-between gap-3 py-2"
                >
                  <span>
                    <span className="font-medium">{s.name}</span>{' '}
                    <span className={`text-xs ${muted}`}>
                      {storeType(s.type).label} · {s.items} {s.items === 1 ? 'product' : 'products'}
                    </span>
                  </span>
                  <span className="tabular-nums">{formatMoney(s.total, s.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <h3 className="font-display text-lg font-semibold">Spending per month</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {stats.months.map((m) => (
              <li key={`${m.month}|${m.currency}`}>
                <div className="flex justify-between">
                  <span>
                    {formatMonth(`${m.month}-01`)}{' '}
                    <span className={`text-xs ${muted}`}>
                      {m.lists} {m.lists === 1 ? 'list' : 'lists'}
                    </span>
                  </span>
                  <span className="tabular-nums">{formatMoney(m.total, m.currency)}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-ink/10 dark:bg-paper/15">
                  <div
                    className="h-full rounded-full bg-quake"
                    style={{ width: `${Math.round((m.total / maxMonth) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel>
        <h3 className="font-display text-lg font-semibold">Most bought products</h3>
        <p className={`mt-1 text-sm ${muted}`}>Prices per unit, across all your lists.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={`text-left text-xs ${muted}`}>
              <tr>
                <th className="py-1 pr-3 font-medium">Product</th>
                <th className="py-1 pr-3 font-medium">Times</th>
                <th className="py-1 pr-3 font-medium">Average</th>
                <th className="py-1 pr-3 font-medium">Lowest</th>
                <th className="py-1 pr-3 font-medium">Highest</th>
                <th className="py-1 font-medium">Last price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 tabular-nums dark:divide-paper/10">
              {stats.products.map((p) => (
                <tr key={`${p.name}|${p.unit}|${p.currency}`}>
                  <td className="py-2 pr-3 font-medium">
                    {p.name} {p.unit ? <span className={`text-xs ${muted}`}>{p.unit}</span> : null}
                  </td>
                  <td className="py-2 pr-3">{p.times}</td>
                  <td className="py-2 pr-3">{price(p.avgPrice, p.currency)}</td>
                  <td className="py-2 pr-3">{price(p.minPrice, p.currency)}</td>
                  <td className="py-2 pr-3">{price(p.maxPrice, p.currency)}</td>
                  <td className="py-2">{price(p.lastPrice, p.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

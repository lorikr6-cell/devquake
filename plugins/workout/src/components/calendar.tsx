import { cn, Link, LOCALE_TAGS, type Locale, type Translate } from '@devquake/ui';
import { heat, monthGrid } from '../lib/stats';

export interface DayInfo {
  workouts: number;
  seconds: number;
  kcal: number;
}

// Calendar heat: one hue (the brand orange), light to dark by minutes worked out (0 = none).
const HEAT = [
  '',
  'bg-quake/15',
  'bg-quake/35',
  'bg-quake/60 text-white',
  'bg-quake/90 text-white',
] as const;

/** Monday … Sunday in the page language (1 January 2024 was a Monday). */
export function weekdayNames(locale: Locale, style: 'short' | 'narrow'): string[] {
  const f = new Intl.DateTimeFormat(LOCALE_TAGS[locale], { weekday: style, timeZone: 'UTC' });
  return Array.from({ length: 7 }, (_, i) => f.format(Date.UTC(2024, 0, 1 + i)));
}

/**
 * A month as a calendar (ADR 0015). Days with a workout are coloured by how long the person
 * trained and link to that day; the tooltip gives the numbers.
 */
export function MonthCalendar({
  year,
  month,
  days,
  today,
  selected,
  locale,
  t,
  compact = false,
  title,
}: {
  year: number;
  month: number;
  days: Record<string, DayInfo>;
  today: string;
  selected?: string;
  locale: Locale;
  t: Translate;
  compact?: boolean;
  /** A heading above the grid (the year view names each month). */
  title?: { label: string; href: string };
}) {
  const weekdays = weekdayNames(locale, compact ? 'narrow' : 'short');
  const number = new Intl.NumberFormat(LOCALE_TAGS[locale]);
  return (
    <div>
      {title ? (
        <Link href={title.href} className="mb-1 block text-sm font-semibold hover:text-quake">
          {title.label}
        </Link>
      ) : null}
      <table
        className="w-full table-fixed border-separate"
        style={{ borderSpacing: compact ? 2 : 4 }}
      >
        <thead>
          <tr>
            {weekdays.map((d, i) => (
              <th
                key={i}
                scope="col"
                className="text-center text-[11px] font-medium text-ink/60 dark:text-paper/60"
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthGrid(year, month).map((week, w) => (
            <tr key={w}>
              {week.map((day, i) => {
                if (!day) return <td key={i} />;
                const info = days[day];
                const level = heat(info?.seconds ?? 0);
                const tip = info
                  ? t('calendar.tooltip', {
                      count: info.workouts,
                      minutes: number.format(Math.round(info.seconds / 60)),
                      kcal: number.format(Math.round(info.kcal)),
                    })
                  : t('calendar.restDay');
                return (
                  <td key={i} className="p-0">
                    <Link
                      href={`/history?view=day&date=${day}`}
                      title={`${day}: ${tip}`}
                      aria-label={`${Number(day.slice(8))}. ${tip}`}
                      aria-current={day === selected ? 'date' : undefined}
                      className={cn(
                        'flex flex-col items-center justify-center rounded-md tabular-nums',
                        compact ? 'aspect-square text-[11px]' : 'min-h-12 text-sm sm:min-h-16',
                        level === 0 ? 'hover:bg-ink/5 dark:hover:bg-paper/10' : HEAT[level],
                        day === today && 'ring-2 ring-ink dark:ring-paper',
                        day === selected && 'outline-2 outline-offset-1 outline-quake',
                      )}
                    >
                      <span className="font-semibold">{Number(day.slice(8))}</span>
                      {!compact && info ? (
                        <span className="text-[10px] leading-tight opacity-90">
                          {t('common.minutes', { minutes: Math.round(info.seconds / 60) })}
                        </span>
                      ) : null}
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** "Less ▢▢▢▢▢ More" for the calendar heat. */
export function HeatLegend({ t }: { t: Translate }) {
  return (
    <p className="flex items-center gap-1 text-xs text-ink/60 dark:text-paper/60">
      {t('calendar.less')}
      {[0, 1, 2, 3, 4].map((l) => (
        <span
          key={l}
          aria-hidden
          className={cn(
            'inline-block size-3 rounded-sm border border-ink/10 dark:border-paper/15',
            HEAT[l as 0],
          )}
        />
      ))}
      {t('calendar.more')}
    </p>
  );
}

/** A few numbers in tiles. */
export function StatTiles({ tiles }: { tiles: [value: string, label: string][] }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {tiles.map(([value, label]) => (
        <div key={label} className="rounded-xl border border-ink/10 p-3 dark:border-paper/10">
          <dt className="text-xs text-ink/60 dark:text-paper/60">{label}</dt>
          <dd className="font-display text-xl font-bold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

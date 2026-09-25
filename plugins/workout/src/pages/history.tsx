import type { ReactNode } from 'react';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { buttonClass, cn, formatDateTime, Link, LOCALE_TAGS, type Translate } from '@devquake/ui';
import { HeatLegend, MonthCalendar, StatTiles, type DayInfo } from '../components/calendar';
import { Feedback, ImprovementList } from '../components/feedback';
import { routineName } from '../components/format';
import { pageScope } from '../components/guard';
import { PhotoSlot } from '../components/photo-slot';
import { Panel } from '../components/ui';
import { localeOf, translator } from '../i18n';
import { improvements, listPhotos, workoutStats } from '../lib/progress';
import {
  addDays,
  dayFeedbackKey,
  daysInMonth,
  feedbackKey,
  groupByDay,
  hoursMinutes,
  localDay,
  longestStreak,
  monthKey,
  parsePeriod,
  shiftMonth,
  totals,
  utcWindow,
  type Totals,
  type WorkoutStat,
} from '../lib/stats';
import { getSetup } from '../lib/data';
import { clock } from '../lib/workout-state';
import { displayWeight, distanceUnit } from '../lib/units';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.history') };
}

/**
 * The calendar (ADR 0015): a day, a month or a year of workouts with their statistics and
 * feedback, and the month's or year's progress photo. The monthly email links here
 * (?view=month&date=YYYY-MM).
 */
export default async function History({ ctx, searchParams }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user } = scope;
  const locale = localeOf(ctx);
  const t = translator(locale);
  const timeZone = ctx.timeZone ?? 'UTC';
  const today = localDay(new Date().toISOString(), timeZone);
  const period = parsePeriod(searchParams.view, searchParams.date, today);
  const number = new Intl.NumberFormat(LOCALE_TAGS[locale]);
  const tag = LOCALE_TAGS[locale];

  // The months to read: the period, and the one before for comparisons.
  const [first, last] =
    period.view === 'day'
      ? [
          `${period.day.slice(0, 7)}-01`,
          `${period.day.slice(0, 7)}-${daysInMonth(+period.day.slice(0, 4), +period.day.slice(5, 7))}`,
        ]
      : period.view === 'month'
        ? [
            `${monthKey(period.year, period.month)}-01`,
            `${monthKey(period.year, period.month)}-${daysInMonth(period.year, period.month)}`,
          ]
        : [`${period.year}-01-01`, `${period.year}-12-31`];
  const before = shiftMonth(+first.slice(0, 4), +first.slice(5, 7), -1);
  const previousFirst =
    period.view === 'year'
      ? `${period.year - 1}-01-01`
      : `${monthKey(before.year, before.month)}-01`;
  const [from, to] = utcWindow(previousFirst, last);
  const [all, photos, setup] = await Promise.all([
    workoutStats(db, user.id, from, to),
    listPhotos(db, user.id),
    getSetup(db, user.id),
  ]);
  const inRange = (w: WorkoutStat, a: string, b: string) => {
    const d = localDay(w.startedAt, timeZone);
    return d >= a && d <= b;
  };
  const current = all.filter((w) => inRange(w, first, last));
  const previous = all.filter((w) => inRange(w, previousFirst, addDays(first, -1)));
  const byDay = groupByDay(current, timeZone);
  const days: Record<string, DayInfo> = {};
  for (const [day, list] of byDay) {
    const s = totals(list, timeZone);
    days[day] = { workouts: s.workouts, seconds: s.seconds, kcal: s.kcal };
  }

  const weightUnit = setup?.profile.weightUnit ?? 'kg';
  const duration = (seconds: number) => {
    const { hours, minutes } = hoursMinutes(seconds);
    return hours ? t('stats.hoursMinutes', { hours, minutes }) : t('common.minutes', { minutes });
  };
  const tilesFor = (s: Totals, streak?: number): [string, string][] => [
    [number.format(s.workouts), t('stats.workouts')],
    [duration(s.seconds), t('stats.time')],
    [t('common.aboutKcal', { kcal: number.format(s.kcal) }), t('stats.kcal')],
    [`${s.completion} %`, t('stats.completion')],
    [number.format(s.reps), t('stats.reps')],
    [
      `${number.format(Math.round(displayWeight(s.volumeKg, weightUnit, 1)))} ${weightUnit}`,
      t('stats.volume'),
    ],
    [number.format(s.activeDays), t('stats.activeDays')],
    ...(streak === undefined
      ? []
      : ([[t('stats.days', { count: streak }), t('stats.streak')]] as [string, string][])),
  ];

  // Tabs keep the date: the day shown, today when it is in the period, else the period's start.
  const anchor =
    period.view === 'day' ? period.day : today >= first && today <= last ? today : first;
  const tabs = (['day', 'month', 'year'] as const).map((v) => ({
    v,
    href: `/history?view=${v}&date=${v === 'day' ? anchor : v === 'month' ? anchor.slice(0, 7) : anchor.slice(0, 4)}`,
  }));
  const label =
    period.view === 'day'
      ? new Intl.DateTimeFormat(tag, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(new Date(`${period.day}T12:00:00Z`))
      : period.view === 'month'
        ? new Intl.DateTimeFormat(tag, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
            Date.UTC(period.year, period.month - 1, 1),
          )
        : String(period.year);
  const nav =
    period.view === 'day'
      ? [
          `/history?view=day&date=${addDays(period.day, -1)}`,
          `/history?view=day&date=${addDays(period.day, 1)}`,
        ]
      : period.view === 'month'
        ? [shiftMonth(period.year, period.month, -1), shiftMonth(period.year, period.month, 1)].map(
            (m) => `/history?view=month&date=${monthKey(m.year, m.month)}`,
          )
        : [
            `/history?view=year&date=${period.year - 1}`,
            `/history?view=year&date=${period.year + 1}`,
          ];
  const todayHref = `/history?view=${period.view}&date=${period.view === 'year' ? today.slice(0, 4) : period.view === 'month' ? today.slice(0, 7) : today}`;
  const photoOf = (kind: 'month' | 'year', periodDate: string) => {
    const p = photos.find((x) => x.kind === kind && x.period === periodDate);
    return p ? { id: p.id, version: p.version } : null;
  };

  let body: ReactNode;
  if (period.view === 'day') {
    const list = byDay.get(period.day) ?? [];
    const found = (await Promise.all(list.map((w) => improvements(db, user.id, w.id)))).flat();
    const s = totals(list, timeZone);
    const unit = distanceUnit(setup?.profile.heightUnit ?? 'cm');
    const [y, m] = [+period.day.slice(0, 4), +period.day.slice(5, 7)];
    body = (
      <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
        <Panel>
          <MonthCalendar
            year={y}
            month={m}
            days={days}
            today={today}
            selected={period.day}
            locale={locale}
            t={t}
            compact
          />
          <Link
            href={`/history?view=month&date=${monthKey(y, m)}`}
            className="mt-2 inline-block text-sm text-quake underline"
          >
            {t('calendar.openMonth')}
          </Link>
        </Panel>
        <div className="space-y-4">
          <Feedback
            text={t(
              `feedback.day.${dayFeedbackKey(s, found.length, found.filter((f) => f.record).length)}`,
            )}
          />
          {list.length ? <StatTiles tiles={tilesFor(s).slice(0, 6)} /> : null}
          {list.map((w) => (
            <Panel key={w.id}>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-semibold">{routineName(t, w)}</h2>
                <span className="text-sm text-ink/60 tabular-nums dark:text-paper/60">
                  {formatDateTime(w.startedAt, timeZone, 'time', locale)}
                </span>
              </div>
              <p className="text-sm text-ink/70 dark:text-paper/70">
                {clock(w.seconds)} ·{' '}
                {w.kcal !== null
                  ? t('common.aboutKcal', { kcal: number.format(Math.round(w.kcal)) })
                  : '—'}{' '}
                · {t('stats.setsOf', { done: w.setsDone, planned: w.setsPlanned })}
              </p>
              <ImprovementList
                items={found.filter((f) => f.sessionId === w.id)}
                t={t}
                unit={unit}
                weightUnit={weightUnit}
                number={number}
              />
              <Link href={`/history/${w.id}`} className={buttonClass('secondary', 'mt-3 min-h-11')}>
                {t('calendar.details')}
              </Link>
            </Panel>
          ))}
        </div>
      </div>
    );
  } else if (period.view === 'month') {
    const s = totals(current, timeZone);
    const key = monthKey(period.year, period.month);
    body = (
      <div className="space-y-6">
        <Panel>
          <MonthCalendar
            year={period.year}
            month={period.month}
            days={days}
            today={today}
            locale={locale}
            t={t}
          />
          <div className="mt-2">
            <HeatLegend t={t} />
          </div>
        </Panel>
        <Feedback
          text={t(`feedback.${feedbackKey(s, totals(previous, timeZone))}`, { count: s.workouts })}
        />
        <StatTiles tiles={tilesFor(s, longestStreak(byDay.keys()))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <PhotoSlot
            kind="month"
            period={key}
            photo={photoOf('month', `${key}-01`)}
            title={t('photos.monthTitle', { month: label })}
          />
          <Panel>
            <h2 className="font-semibold">{t('calendar.compareTitle')}</h2>
            <CompareRows
              current={s}
              previous={totals(previous, timeZone)}
              t={t}
              number={number}
              duration={duration}
            />
          </Panel>
        </div>
      </div>
    );
  } else {
    const s = totals(current, timeZone);
    const perMonth = Array.from({ length: 12 }, (_, i) => {
      const k = monthKey(period.year, i + 1);
      return totals(
        current.filter((w) => localDay(w.startedAt, timeZone).startsWith(k)),
        timeZone,
      );
    });
    const most = Math.max(1, ...perMonth.map((x) => x.workouts));
    const monthName = new Intl.DateTimeFormat(tag, { month: 'long', timeZone: 'UTC' });
    const monthShort = new Intl.DateTimeFormat(tag, { month: 'short', timeZone: 'UTC' });
    body = (
      <div className="space-y-6">
        <Feedback
          text={t(`feedback.${feedbackKey(s, totals(previous, timeZone))}`, { count: s.workouts })}
        />
        <StatTiles tiles={tilesFor(s, longestStreak(byDay.keys()))} />
        <Panel>
          <h2 className="font-semibold">{t('calendar.perMonth')}</h2>
          <ul className="mt-3 space-y-1.5">
            {perMonth.map((x, i) => (
              <li key={i}>
                <Link
                  href={`/history?view=month&date=${monthKey(period.year, i + 1)}`}
                  className="grid grid-cols-[3rem_1fr_5rem] items-center gap-2 text-sm hover:text-quake"
                  title={`${monthName.format(Date.UTC(period.year, i, 1))}: ${t('stats.workoutsCount', { count: x.workouts })}`}
                >
                  <span className="text-ink/70 dark:text-paper/70">
                    {monthShort.format(Date.UTC(period.year, i, 1))}
                  </span>
                  <span className="h-3 rounded-sm bg-ink/5 dark:bg-paper/10">
                    <span
                      className="block h-3 rounded-sm bg-quake"
                      style={{ width: `${(x.workouts / most) * 100}%` }}
                    />
                  </span>
                  <span className="text-right tabular-nums">
                    {t('stats.workoutsCount', { count: x.workouts })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }, (_, i) => (
            <Panel key={i} className="p-3 sm:p-3">
              <MonthCalendar
                year={period.year}
                month={i + 1}
                days={days}
                today={today}
                locale={locale}
                t={t}
                compact
                title={{
                  label: monthName.format(Date.UTC(period.year, i, 1)),
                  href: `/history?view=month&date=${monthKey(period.year, i + 1)}`,
                }}
              />
            </Panel>
          ))}
        </div>
        <HeatLegend t={t} />
        <div className="max-w-sm">
          <PhotoSlot
            kind="year"
            period={String(period.year)}
            photo={photoOf('year', `${period.year}-01-01`)}
            title={t('photos.yearTitle', { year: period.year })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">{t('calendar.title')}</h1>
        <Link href="/progress" className={buttonClass('secondary', 'min-h-11')}>
          {t('nav.progress')}
        </Link>
      </div>
      <nav
        aria-label={t('calendar.views')}
        className="grid grid-cols-3 rounded-lg border border-ink/15 p-1 dark:border-paper/15"
      >
        {tabs.map(({ v, href }) => (
          <Link
            key={v}
            href={href}
            aria-current={period.view === v ? 'page' : undefined}
            className={cn(
              'flex min-h-10 items-center justify-center rounded-md text-sm font-medium',
              period.view === v
                ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                : 'text-ink/70 hover:bg-ink/5 dark:text-paper/70 dark:hover:bg-paper/10',
            )}
          >
            {t(`calendar.${v}`)}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <Link
          href={nav[0]!}
          className={buttonClass('secondary', 'min-h-11 min-w-11 px-3')}
          aria-label={t('calendar.previous')}
        >
          ‹
        </Link>
        <h2 className="flex-1 text-center font-display text-lg font-bold capitalize">{label}</h2>
        <Link
          href={nav[1]!}
          className={buttonClass('secondary', 'min-h-11 min-w-11 px-3')}
          aria-label={t('calendar.next')}
        >
          ›
        </Link>
        <Link href={todayHref} className={buttonClass('ghost', 'min-h-11 px-3')}>
          {t('calendar.today')}
        </Link>
      </div>
      {body}
    </div>
  );
}

function CompareRows({
  current,
  previous,
  t,
  number,
  duration,
}: {
  current: Totals;
  previous: Totals;
  t: Translate;
  number: Intl.NumberFormat;
  duration: (s: number) => string;
}) {
  const rows: [string, string, string, number][] = [
    [
      t('stats.workouts'),
      number.format(previous.workouts),
      number.format(current.workouts),
      current.workouts - previous.workouts,
    ],
    [
      t('stats.time'),
      duration(previous.seconds),
      duration(current.seconds),
      current.seconds - previous.seconds,
    ],
    [
      t('stats.reps'),
      number.format(previous.reps),
      number.format(current.reps),
      current.reps - previous.reps,
    ],
  ];
  return (
    <table className="mt-2 w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-ink/60 dark:text-paper/60">
          <th scope="col" className="py-1 font-medium" />
          <th scope="col" className="py-1 text-right font-medium">
            {t('calendar.before')}
          </th>
          <th scope="col" className="py-1 text-right font-medium">
            {t('calendar.now')}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, a, b, diff]) => (
          <tr key={label} className="border-t border-ink/10 dark:border-paper/10">
            <th scope="row" className="py-1.5 text-left font-normal">
              {label}
            </th>
            <td className="py-1.5 text-right tabular-nums">{a}</td>
            <td className="py-1.5 text-right font-semibold tabular-nums">
              {b} <span aria-hidden>{diff > 0 ? '▲' : diff < 0 ? '▼' : ''}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

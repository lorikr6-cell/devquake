import { redirect } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { buttonClass, formatDateTime, Link, LOCALE_TAGS, localizePath } from '@devquake/ui';
import { DiscardButton, StartButton } from '../components/session-buttons';
import { routineName } from '../components/format';
import { pageScope } from '../components/guard';
import { Panel, SvgIcon } from '../components/ui';
import { localeOf, translator } from '../i18n';
import { LOCATION_ICONS } from '../illustrations/icons';
import { StickFigure } from '../illustrations/stick-figure';
import { routineEstimate } from '../lib/calories';
import {
  activeSession,
  getSetup,
  listRoutines,
  recentSessions,
  weekStats,
  type RoutineView,
} from '../lib/data';
import { listPlan } from '../lib/own-routines';
import { formatTime, slotsForDay, weekdayIn } from '../lib/plan';
import { clock } from '../lib/workout-state';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.home') };
}

/**
 * The dashboard: the running workout (if any), today's plan, the person's own routines and the
 * suggested routines of every place with a Start button, and the last workouts. The first
 * visit goes to the setup wizard.
 */
export default async function Home({ ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user } = scope;
  const locale = localeOf(ctx);
  const t = translator(locale);
  const timeZone = ctx.timeZone ?? 'UTC';

  const setup = await getSetup(db, user.id);
  if (!setup) redirect(localizePath('/setup', locale));

  const [routines, active, recent, week, plan] = await Promise.all([
    listRoutines(db, user.id),
    activeSession(db, user.id),
    recentSessions(db, user.id),
    weekStats(db, user.id),
    listPlan(db, user.id),
  ]);
  // Today in the person's own time zone (ADR 0010, 0018).
  const todaySlots = slotsForDay(plan, weekdayIn(new Date(), timeZone));
  const own = routines.filter((r) => r.source === 'custom');
  const number = new Intl.NumberFormat(LOCALE_TAGS[locale]);
  const bodyWeight = setup.profile.weightKg;

  /** A routine card; own routines also show their place. */
  const card = (r: RoutineView, showPlace: boolean) => {
    const estimate = routineEstimate(
      r.items,
      (slug) => r.items.find((i) => i.slug === slug)?.exercise,
      bodyWeight,
    );
    const main = r.items.filter((i) => i.phase === 'main');
    const first = main[0]?.exercise;
    return (
      <Panel className="flex h-full flex-col">
        <div className="flex items-start gap-3">
          {first ? (
            <StickFigure
              motion={first.motion}
              prop={first.prop}
              still
              className="size-16 shrink-0 text-ink/70 dark:text-paper/70"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold">{routineName(t, r)}</h3>
            {showPlace ? (
              <p className="text-xs font-medium text-quake">{t(`locations.${r.location}.name`)}</p>
            ) : null}
            <p className="text-xs text-ink/60 dark:text-paper/60">
              {t('dashboard.exercises', { count: main.length })}
              {' · '}
              {t('dashboard.estimate', {
                minutes: Math.round(estimate.seconds / 60),
                kcal: number.format(estimate.kcal),
              })}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-ink/70 dark:text-paper/70">
              {main.map((i) => t(`exercises.${i.slug}.name`)).join(', ')}
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2 pt-1 sm:mt-auto">
          <StartButton routineId={r.id} className="flex-1" />
          <Link href={`/routines/${r.id}`} className={buttonClass('secondary', 'min-h-11')}>
            {t('dashboard.details')}
          </Link>
        </div>
      </Panel>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">
          {t('dashboard.greeting', { name: user.displayName })}
        </h1>
        <p className="mt-1 text-ink/70 dark:text-paper/70">{t('dashboard.intro')}</p>
      </div>

      {active ? (
        <Panel className="border-quake/50 bg-quake/5 dark:bg-quake/10">
          <h2 className="font-display text-lg font-bold">{t('dashboard.activeTitle')}</h2>
          <p className="mt-1 text-sm">
            {t('dashboard.activeBody', {
              name: routineName(t, active),
              time: formatDateTime(active.startedAt, timeZone, 'time', locale),
            })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/workout/${active.id}`}
              className={buttonClass('primary', 'min-h-11 flex-1 sm:flex-none')}
            >
              {t('dashboard.continue')}
            </Link>
            <DiscardButton sessionId={active.id} />
          </div>
        </Panel>
      ) : null}

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          [t('dashboard.weekWorkouts', { count: week.workouts }), t('dashboard.weekTitle')],
          [t('common.minutes', { minutes: number.format(week.minutes) }), t('dashboard.weekTime')],
          [t('common.aboutKcal', { kcal: number.format(week.kcal) }), t('dashboard.weekKcal')],
        ].map(([value, label]) => (
          <div key={label} className="rounded-xl border border-ink/10 p-3 dark:border-paper/10">
            <p className="font-display text-lg font-bold tabular-nums">{value}</p>
            <p className="text-xs text-ink/60 dark:text-paper/60">{label}</p>
          </div>
        ))}
      </div>

      <Panel>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold">{t('plan.todayTitle')}</h2>
          <Link href="/plan" className="text-sm font-medium text-quake hover:underline">
            {todaySlots.length ? t('plan.open') : t('plan.planWeek')}
          </Link>
        </div>
        {todaySlots.length === 0 ? (
          <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">{t('plan.nothingToday')}</p>
        ) : (
          <ul className="mt-2 divide-y divide-ink/10 dark:divide-paper/10">
            {todaySlots.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-2">
                <span className="w-28 font-medium tabular-nums">
                  {formatTime(s.start)}–{formatTime(s.start + s.duration)}
                </span>
                <span className="min-w-0 flex-1">
                  {routineName(t, { template: s.template, name: s.routineName })}
                </span>
                <StartButton routineId={s.routineId} className="w-full sm:w-auto" />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-bold">{t('builder.ownTitle')}</h2>
          <Link href="/routines/new" className={buttonClass('secondary', 'min-h-11')}>
            + {t('builder.newTitle')}
          </Link>
        </div>
        {own.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">{t('builder.ownEmpty')}</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {own.map((r) => (
              <li key={r.id}>{card(r, true)}</li>
            ))}
          </ul>
        )}
      </section>

      {setup.locations.map((location) => {
        const own = routines.filter((r) => r.location === location && r.source !== 'custom');
        return (
          <section key={location}>
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <SvgIcon svg={LOCATION_ICONS[location]} className="size-6 text-quake" />
              {t(`locations.${location}.name`)}
            </h2>
            {own.length === 0 ? (
              <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">
                {t('dashboard.noRoutines')}
              </p>
            ) : (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {own.map((r) => (
                  <li key={r.id}>{card(r, false)}</li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <section>
        <h2 className="font-display text-xl font-bold">{t('dashboard.recentTitle')}</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">
            {t('dashboard.recentEmpty')}
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-ink/10 rounded-xl border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
            {recent.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/history/${s.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-ink/5 dark:hover:bg-paper/10"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{routineName(t, s)}</span>
                    <span className="block text-xs text-ink/60 dark:text-paper/60">
                      {formatDateTime(s.startedAt, timeZone, 'datetime', locale)}
                    </span>
                  </span>
                  <span className="text-right text-sm tabular-nums">
                    {clock(s.seconds)}
                    {s.kcal !== null ? (
                      <span className="block text-xs text-ink/60 dark:text-paper/60">
                        {t('common.aboutKcal', { kcal: number.format(Math.round(s.kcal)) })}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/profile" className={buttonClass('secondary', 'min-h-11')}>
          {t('dashboard.profileLink')}
        </Link>
        <span className="text-xs text-ink/50 dark:text-paper/50">{t('setup.disclaimer')}</span>
      </p>
    </div>
  );
}

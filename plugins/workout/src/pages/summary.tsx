import { notFound, redirect } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { buttonClass, formatDateTime, Link, LOCALE_TAGS, localizePath } from '@devquake/ui';
import { Feedback, ImprovementList } from '../components/feedback';
import { exerciseName, routineName } from '../components/format';
import { pageScope } from '../components/guard';
import { Panel } from '../components/ui';
import { localeOf, translator } from '../i18n';
import { StickFigure } from '../illustrations/stick-figure';
import { weightStep, type HandProp } from '../lib/catalog';
import { getSession } from '../lib/data';
import { improvements } from '../lib/progress';
import { dayFeedbackKey, totals } from '../lib/stats';
import { HttpError } from '../lib/http';
import type { SessionItemView, SessionView, SetResult } from '../lib/model';
import { nextTarget, type Target } from '../lib/progression';
import { displayDistance, displayWeight, distanceUnit } from '../lib/units';
import { clock } from '../lib/workout-state';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.summary') };
}

const duration = (item: SessionItemView) =>
  item.startedAt && item.endedAt
    ? (new Date(item.endedAt).getTime() - new Date(item.startedAt).getTime()) / 1000
    : null;

/** The suggestion for this exercise in the next workout, from today's sets. */
function nextFor(item: SessionItemView): Target {
  const base = {
    reps: item.targetReps,
    seconds: item.targetSeconds,
    distanceM: item.targetDistanceM,
    weightKg: item.targetWeightKg,
  };
  const plan = {
    metric: item.metric,
    sets: item.sets,
    repsMin: item.repsMin,
    repsMax: item.repsMax,
    weighted: item.weighted,
    weightStep: weightStep(item.equipment),
  };
  return nextTarget(plan, base, { target: base, sets: item.results.filter((r) => r.doneAt) });
}

/** A finished workout: time, calories, every exercise's sets and the next suggestion. */
export default async function Summary({ params, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const sessionId = Number(params.id);
  if (!Number.isSafeInteger(sessionId) || sessionId <= 0) notFound();
  const locale = localeOf(ctx);
  const t = translator(locale);
  const session: SessionView = await getSession(scope.db, scope.user.id, sessionId).catch((err) => {
    if (err instanceof HttpError) notFound();
    throw err;
  });
  if (session.status !== 'finished') redirect(localizePath(`/workout/${sessionId}`, locale));

  const number = new Intl.NumberFormat(LOCALE_TAGS[locale], { maximumFractionDigits: 2 });
  // What got better than last time, and a word of encouragement (ADR 0015).
  const better = await improvements(scope.db, scope.user.id, sessionId);
  const unit = distanceUnit(session.heightUnit);
  const wu = session.weightUnit;
  const weight = (kg: number) =>
    `${number.format(displayWeight(kg, wu, wu === 'kg' ? 0.25 : 0.5))} ${wu}`;
  const total =
    (new Date(session.finishedAt ?? session.now).getTime() -
      new Date(session.startedAt).getTime()) /
    1000;
  const setsDone = session.items.reduce((n, i) => n + i.results.filter((r) => r.doneAt).length, 0);
  const setsPlanned = session.items.reduce((n, i) => n + i.sets, 0);

  const repsText = (reps: number | null, kg: number | null) => {
    const text = t('summary.reps', { count: reps ?? 0 });
    return kg ? `${text} · ${weight(kg)}` : text;
  };
  const result = (item: SessionItemView, r: SetResult) => {
    if (item.metric === 'reps') return repsText(r.reps, r.weightKg);
    if (item.metric === 'time') return clock(r.seconds ?? 0);
    return `${number.format(displayDistance(r.distanceM ?? 0, unit))} ${unit} · ${clock(r.seconds ?? 0)}`;
  };
  const target = (item: SessionItemView, next: Target) => {
    if (item.metric === 'reps') return repsText(next.reps, next.weightKg);
    if (item.metric === 'time') return t('summary.secondsValue', { seconds: next.seconds ?? 0 });
    return `${number.format(displayDistance(next.distanceM ?? 0, unit))} ${unit}`;
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('summary.title')}</h1>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
          {routineName(t, session)} ·{' '}
          {formatDateTime(session.startedAt, ctx.timeZone ?? 'UTC', 'datetime', locale)}
        </p>
      </div>

      <div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            [clock(total), t('summary.total')],
            [
              session.kcal !== null
                ? t('common.aboutKcal', { kcal: number.format(Math.round(session.kcal)) })
                : '—',
              t('summary.kcal'),
            ],
            [t('summary.setsValue', { done: setsDone, planned: setsPlanned }), t('summary.sets')],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl border border-ink/10 p-3 dark:border-paper/10">
              <p className="font-display text-xl font-bold tabular-nums">{value}</p>
              <p className="text-xs text-ink/60 dark:text-paper/60">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink/50 dark:text-paper/50">{t('summary.kcalHint')}</p>
      </div>

      <Feedback
        text={t(
          `feedback.day.${dayFeedbackKey(
            totals([
              {
                id: session.id,
                template: session.template,
                routineName: session.routineName,
                startedAt: session.startedAt,
                seconds: total,
                kcal: session.kcal,
                setsDone,
                setsPlanned,
                reps: 0,
                volumeKg: 0,
              },
            ]),
            better.length,
            better.filter((b) => b.record).length,
          )}`,
        )}
      />
      <ImprovementList items={better} t={t} unit={unit} weightUnit={wu} number={number} />

      <ul className="space-y-3">
        {session.items.map((item) => {
          const done = item.results.filter((r) => r.doneAt);
          const time = duration(item);
          return (
            <li key={item.id}>
              <Panel className="flex gap-3">
                {item.motion ? (
                  <StickFigure
                    motion={item.motion}
                    prop={item.prop as HandProp | null}
                    still
                    className="size-14 shrink-0 text-ink/70 dark:text-paper/70"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="font-semibold">{exerciseName(t, item)}</h2>
                    <span className="text-sm text-ink/70 tabular-nums dark:text-paper/70">
                      {time === null ? '—' : clock(time)}
                    </span>
                  </div>
                  {done.length === 0 ? (
                    <p className="text-sm text-ink/60 dark:text-paper/60">{t('summary.skipped')}</p>
                  ) : (
                    <ol className="mt-1 flex flex-wrap gap-1.5">
                      {done.map((r) => {
                        const short =
                          item.metric === 'reps' &&
                          item.targetReps !== null &&
                          (r.reps ?? 0) < item.targetReps;
                        return (
                          <li
                            key={r.setNo}
                            className={
                              short
                                ? 'rounded-md bg-ink/5 px-2 py-0.5 text-xs tabular-nums dark:bg-paper/10'
                                : 'rounded-md bg-quake/10 px-2 py-0.5 text-xs tabular-nums dark:bg-quake/20'
                            }
                          >
                            {result(item, r)}
                          </li>
                        );
                      })}
                    </ol>
                  )}
                  {item.phase === 'main' ? (
                    <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">
                      {t('summary.next', { target: target(item, nextFor(item)) })}
                    </p>
                  ) : null}
                </div>
              </Panel>
            </li>
          );
        })}
      </ul>

      <Link href="/" className={buttonClass('primary', 'min-h-12 w-full sm:w-auto')}>
        {t('summary.back')}
      </Link>
    </div>
  );
}

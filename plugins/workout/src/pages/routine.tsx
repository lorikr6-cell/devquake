import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { buttonClass, Link, LOCALE_TAGS } from '@devquake/ui';
import { exerciseHowTo, exerciseName, prescription, routineName } from '../components/format';
import { pageScope } from '../components/guard';
import { StartButton } from '../components/session-buttons';
import { DeleteRoutineButton } from '../components/routine-actions';
import { Panel, SvgIcon } from '../components/ui';
import { localeOf, translator } from '../i18n';
import { LOCATION_ICONS } from '../illustrations/icons';
import { equipmentScenes } from '../illustrations/motions';
import { StickFigure } from '../illustrations/stick-figure';
import { routineEstimate } from '../lib/calories';
import { getRoutine, getSetup, listEquipment } from '../lib/data';
import { HttpError } from '../lib/http';
import { distanceUnit } from '../lib/units';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.routine') };
}

/** One routine: every exercise with its animation, how-to, sets and the equipment it needs. */
export default async function Routine({ params, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const routineId = Number(params.id);
  if (!Number.isSafeInteger(routineId) || routineId <= 0) notFound();
  const locale = localeOf(ctx);
  const t = translator(locale);
  const [routine, setup, equipment] = await Promise.all([
    getRoutine(scope.db, scope.user.id, routineId).catch((err) => {
      if (err instanceof HttpError) notFound();
      throw err;
    }),
    getSetup(scope.db, scope.user.id),
    listEquipment(scope.db),
  ]);
  const icons = new Map(equipment.map((e) => [e.slug, e.iconSvg]));
  const number = new Intl.NumberFormat(LOCALE_TAGS[locale], { maximumFractionDigits: 2 });
  const unit = distanceUnit(setup?.profile.heightUnit ?? 'cm');
  const estimate = routineEstimate(
    routine.items,
    (slug) => routine.items.find((i) => i.slug === slug)?.exercise,
    setup?.profile.weightKg ?? 75,
  );

  const section = (phase: 'warmup' | 'main') => {
    const items = routine.items.filter((i) => i.phase === phase);
    if (items.length === 0) return null;
    return (
      <section>
        <h2 className="font-display text-xl font-bold">
          {t(phase === 'warmup' ? 'routine.warmupTitle' : 'routine.mainTitle')}
        </h2>
        <ul className="mt-3 space-y-3">
          {items.map((item) => {
            const e = item.exercise;
            const name = exerciseName(t, e);
            return (
              <li key={`${phase}-${item.slug}`}>
                <Panel className="flex gap-3">
                  <StickFigure
                    motion={e.motion}
                    prop={e.prop}
                    scenes={equipmentScenes(e.equipment)}
                    className="size-24 shrink-0 text-ink/80 sm:size-28 dark:text-paper/80"
                    title={name}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{name}</h3>
                    <p className="text-sm font-medium text-quake">
                      {prescription(t, item, unit, number)}
                      {item.restSeconds > 0 && item.sets > 1
                        ? ` · ${t('routine.rest', { seconds: item.restSeconds })}`
                        : ''}
                    </p>
                    <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
                      {exerciseHowTo(t, e)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/60 dark:text-paper/60">
                      {e.muscles.length ? (
                        <span>{e.muscles.map((m) => t(`muscles.${m}`)).join(', ')}</span>
                      ) : null}
                      {e.equipment.map((slug) => {
                        const icon = icons.get(slug);
                        return (
                          <span key={slug} className="inline-flex items-center gap-1">
                            {icon ? <SvgIcon svg={icon} className="size-4" /> : null}
                            {t(`equipment.${slug}`)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </Panel>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/" className="text-sm text-ink/70 hover:text-quake dark:text-paper/70">
          ← {t('nav.dashboard')}
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold">{routineName(t, routine)}</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-ink/70 dark:text-paper/70">
          <SvgIcon svg={LOCATION_ICONS[routine.location]} className="size-5 text-quake" />
          {t(`locations.${routine.location}.name`)}
          {' · '}
          {t('dashboard.estimate', {
            minutes: Math.round(estimate.seconds / 60),
            kcal: number.format(estimate.kcal),
          })}
        </p>
        {routine.source === 'custom' ? (
          <p className="mt-2 inline-flex rounded-full bg-quake/10 px-2.5 py-0.5 text-xs font-semibold">
            {t('builder.ownBadge')}
          </p>
        ) : null}
        <StartButton
          routineId={routine.id}
          className="mt-4 sm:max-w-xs"
          label={t('routine.startWorkout')}
        />
        {/* Own routines can be changed and deleted; suggested ones copied (ADR 0018). */}
        <div className="mt-3 flex flex-wrap gap-2">
          {routine.source === 'custom' ? (
            <Link
              href={`/routines/${routine.id}/edit`}
              className={buttonClass('secondary', 'min-h-11')}
            >
              {t('builder.edit')}
            </Link>
          ) : (
            <Link
              href={`/routines/new?from=${routine.id}`}
              className={buttonClass('secondary', 'min-h-11')}
            >
              {t('builder.copy')}
            </Link>
          )}
          <Link
            href={`/plan?routine=${routine.id}`}
            className={buttonClass('secondary', 'min-h-11')}
          >
            {t('plan.addThis')}
          </Link>
          {routine.source === 'custom' ? (
            <DeleteRoutineButton routineId={routine.id} name={routineName(t, routine)} />
          ) : null}
        </div>
      </div>
      {section('warmup')}
      {section('main')}
    </div>
  );
}

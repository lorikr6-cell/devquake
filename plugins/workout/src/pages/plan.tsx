import { redirect } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localizePath } from '@devquake/ui';
import { routineName } from '../components/format';
import { pageScope } from '../components/guard';
import { PlanEditor } from '../components/plan-editor';
import { localeOf, translator } from '../i18n';
import { routineEstimate } from '../lib/calories';
import { getSetup, listRoutines } from '../lib/data';
import { listPlan, rememberTimeZone } from '../lib/own-routines';
import { defaultDuration, weekdayIn } from '../lib/plan';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.plan') };
}

/**
 * The workout plan (ADR 0018): which routine at which time, every day or per weekday; today is
 * the person's today (their time zone). `?routine=<id>` preselects a routine.
 */
export default async function Plan({ searchParams, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user } = scope;
  const locale = localeOf(ctx);
  const t = translator(locale);
  const setup = await getSetup(db, user.id);
  if (!setup) redirect(localizePath('/setup', locale));
  const [routines, plan] = await Promise.all([
    listRoutines(db, user.id),
    listPlan(db, user.id),
    // Reminders are sent at the person's local time (ADR 0019).
    rememberTimeZone(db, user.id, ctx.timeZone),
  ]);

  const place = (location: string) => t(`locations.${location}.name`);
  const options = routines.map((r) => {
    const estimate = routineEstimate(
      r.items,
      (slug) => r.items.find((i) => i.slug === slug)?.exercise,
      setup.profile.weightKg,
    );
    return {
      id: r.id,
      label: `${routineName(t, r)} · ${place(r.location)}`,
      minutes: defaultDuration(estimate.seconds),
    };
  });
  const entries = plan.map((e) => ({
    id: e.id,
    routineId: e.routineId,
    weekday: e.weekday,
    start: e.start,
    duration: e.duration,
    remindMinutes: e.remindMinutes,
    label: routineName(t, { template: e.template, name: e.routineName }),
  }));
  const wanted = Number(searchParams.routine);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('plan.title')}</h1>
        <p className="mt-1 max-w-prose text-ink/70 dark:text-paper/70">{t('plan.intro')}</p>
      </div>
      <PlanEditor
        entries={entries}
        routines={options}
        today={weekdayIn(new Date(), ctx.timeZone ?? 'UTC')}
        initialRoutine={Number.isSafeInteger(wanted) ? wanted : undefined}
      />
    </div>
  );
}

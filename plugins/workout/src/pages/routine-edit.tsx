import { notFound, redirect } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, localizePath } from '@devquake/ui';
import { routineName } from '../components/format';
import { pageScope } from '../components/guard';
import { RoutineBuilder, type BuilderExercise } from '../components/routine-builder';
import { localeOf, translator } from '../i18n';
import { getRoutine, getSetup, loadExercisesFor, type RoutineView } from '../lib/data';
import { ageGroup } from '../lib/generator';
import { HttpError } from '../lib/http';
import { distanceUnit } from '../lib/units';

export function generateMetadata({ params, ctx }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  return { title: params.id ? t('meta.routineEdit') : t('meta.routineNew') };
}

/**
 * The routine builder (ADR 0018): /routines/new (optionally ?from=<id> to start from a copy of
 * any of the person's routines) and /routines/:id/edit for their own routines.
 */
export default async function RoutineEdit({ params, searchParams, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user } = scope;
  const locale = localeOf(ctx);
  const t = translator(locale);
  const setup = await getSetup(db, user.id);
  if (!setup) redirect(localizePath('/setup', locale));

  const load = async (value: unknown): Promise<RoutineView | null> => {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) return null;
    return getRoutine(db, user.id, id).catch((err) => {
      if (err instanceof HttpError) return null;
      throw err;
    });
  };
  const editing = params.id ? await load(params.id) : null;
  // Only own routines can be edited; suggested ones are copied instead.
  if (params.id && (!editing || editing.source !== 'custom')) notFound();
  const from = !editing && searchParams.from ? await load(searchParams.from) : null;
  const source = editing ?? from;

  // Built-in exercises and the person's own ones (ADR 0019).
  const catalogue = await loadExercisesFor(db, user.id);
  const exercises: BuilderExercise[] = catalogue.map((e) => ({ ...e }));
  const known = new Set(catalogue.map((e) => e.slug));
  const initial = {
    name: editing
      ? (editing.name ?? '')
      : from
        ? t('builder.copyName', { name: routineName(t, from) }).slice(0, 80)
        : '',
    location: source?.location ?? setup.locations[0] ?? 'home',
    // Exercises that were retired from the catalogue are left out.
    items: (source?.items ?? [])
      .filter((i) => known.has(i.slug))
      .map(({ exercise: _e, ...item }) => item),
  };
  const age = ageGroup(setup.profile.birthYear, new Date().getUTCFullYear());

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link
          href={editing ? `/routines/${editing.id}` : '/'}
          className="text-sm text-ink/70 hover:text-quake dark:text-paper/70"
        >
          ← {editing ? routineName(t, editing) : t('nav.dashboard')}
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold">
          {editing ? t('builder.editTitle') : t('builder.newTitle')}
        </h1>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('builder.intro')}</p>
      </div>
      <RoutineBuilder
        routineId={editing?.id}
        initial={initial}
        exercises={exercises}
        profile={setup.profile}
        age={age}
        unit={distanceUnit(setup.profile.heightUnit)}
        hostUrl={ctx.hostUrl}
      />
    </div>
  );
}

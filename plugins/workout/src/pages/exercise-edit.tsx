import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link } from '@devquake/ui';
import { ExerciseForm, type ExerciseFormValues } from '../components/exercise-form';
import { pageScope } from '../components/guard';
import { localeOf, translator } from '../i18n';
import { getSetup } from '../lib/data';
import { HttpError } from '../lib/http';
import { getOwnExercise } from '../lib/own-exercises';

export function generateMetadata({ params, ctx }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  return { title: params.id ? t('ownExercises.editTitle') : t('ownExercises.newTitle') };
}

/** /exercises/new and /exercises/:id/edit: an own exercise (ADR 0019). */
export default async function ExerciseEdit({ params, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const t = translator(localeOf(ctx));
  let initial: ExerciseFormValues;
  let exerciseId: number | undefined;
  if (params.id) {
    exerciseId = Number(params.id);
    if (!Number.isSafeInteger(exerciseId) || exerciseId <= 0) notFound();
    const e = await getOwnExercise(scope.db, scope.user.id, exerciseId).catch((err) => {
      if (err instanceof HttpError) notFound();
      throw err;
    });
    initial = {
      name: e.name ?? '',
      howTo: e.howTo ?? '',
      role: e.role,
      pattern: e.pattern,
      metric: e.metric,
      places: [...e.places],
      equipment: [...e.equipment],
      muscles: [...e.muscles],
      difficulty: e.difficulty,
      weighted: e.weighted,
      lowImpact: e.lowImpact,
    };
  } else {
    const setup = await getSetup(scope.db, scope.user.id);
    initial = {
      name: '',
      howTo: '',
      role: 'strength',
      pattern: 'squat',
      metric: 'reps',
      places: setup?.locations.length ? [...setup.locations] : ['home'],
      equipment: [],
      muscles: [],
      difficulty: 1,
      weighted: false,
      lowImpact: false,
    };
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/exercises" className="text-sm text-ink/70 hover:text-quake dark:text-paper/70">
          ← {t('ownExercises.title')}
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold">
          {exerciseId ? t('ownExercises.editTitle') : t('ownExercises.newTitle')}
        </h1>
      </div>
      <ExerciseForm exerciseId={exerciseId} initial={initial} hostUrl={ctx.hostUrl} />
    </div>
  );
}

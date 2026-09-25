import type { PluginPageProps } from '@devquake/plugin-sdk';
import { buttonClass, Link } from '@devquake/ui';
import { pageScope } from '../components/guard';
import { Panel } from '../components/ui';
import { localeOf, translator } from '../i18n';
import { StickFigure } from '../illustrations/stick-figure';
import { listOwnExercises } from '../lib/own-exercises';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.exercises') };
}

/** The person's own exercises (ADR 0019), to use in their own routines. */
export default async function Exercises({ ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const t = translator(localeOf(ctx));
  const exercises = await listOwnExercises(scope.db, scope.user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/" className="text-sm text-ink/70 hover:text-quake dark:text-paper/70">
          ← {t('nav.dashboard')}
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-display text-3xl font-bold">{t('ownExercises.title')}</h1>
          <Link href="/exercises/new" className={buttonClass('primary', 'min-h-11')}>
            + {t('ownExercises.newTitle')}
          </Link>
        </div>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('ownExercises.intro')}</p>
      </div>
      {exercises.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('ownExercises.empty')}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {exercises.map((e) => (
            <li key={e.id}>
              <Panel className="flex items-center gap-3">
                <StickFigure
                  motion={e.motion}
                  prop={e.prop}
                  still
                  className="size-16 shrink-0 text-ink/70 dark:text-paper/70"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold break-words">{e.name}</h2>
                  <p className="text-xs text-ink/60 dark:text-paper/60">
                    {t(`builder.roles.${e.role}`)} ·{' '}
                    {e.places.map((p) => t(`locations.${p}.name`)).join(', ')}
                  </p>
                </div>
                <Link
                  href={`/exercises/${e.id}/edit`}
                  className={buttonClass('secondary', 'min-h-11')}
                >
                  {t('ownExercises.edit')}
                </Link>
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

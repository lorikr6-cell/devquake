import type { PluginPageProps } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, rich } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { SAMPLE_WEEK, workoutVolume } from '../lib/sample';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.home') };
}

const panel = 'rounded-lg border border-ink/10 p-5 dark:border-paper/10';

/**
 * Placeholder home screen (0.1.0): greets the signed-in DevQuake user and shows a sample week.
 * The host only lets subscribers in (ADR 0006); the sign-in notice is for local development.
 */
export default function Home({ ctx }: PluginPageProps) {
  const locale = localeOf(ctx);
  const t = translator(locale);

  if (!ctx.user) {
    return (
      <div className={`${panel} mx-auto max-w-lg text-center`}>
        <h1 className="font-display text-2xl font-bold">{t('guard.signInTitle')}</h1>
        <p className="mt-3 text-sm text-ink/70 dark:text-paper/70">
          {rich(t('guard.signInBody'), {
            link: (
              <a className="font-medium text-quake underline" href={`${ctx.hostUrl}/#account`}>
                {t('guard.signInLink')}
              </a>
            ),
          })}
        </p>
      </div>
    );
  }

  const tag = LOCALE_TAGS[locale];
  const number = new Intl.NumberFormat(tag);
  // 1 January 2024 was a Monday, so day N of the sample week is 2024-01-N.
  const weekday = new Intl.DateTimeFormat(tag, { weekday: 'long', timeZone: 'UTC' });
  const dayName = (day: number) => weekday.format(Date.UTC(2024, 0, day));

  return (
    <>
      <h1 className="font-display text-3xl font-bold">
        {t('home.greeting', { name: ctx.user.displayName })}
      </h1>
      <p className="mt-3 max-w-2xl text-ink/80 dark:text-paper/80">{t('home.intro')}</p>
      <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">{t('home.signedIn')}</p>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold">{t('home.previewTitle')}</h2>
        <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">{t('home.previewNote')}</p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          {SAMPLE_WEEK.map((workout) => (
            <li key={workout.key} className={panel}>
              <p className="text-xs uppercase tracking-wide text-ink/60 dark:text-paper/60">
                {dayName(workout.day)}
              </p>
              <h3 className="mt-1 font-semibold">{t(`sample.workouts.${workout.key}`)}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {workout.exercises.map((e) => (
                  <li key={e.exercise}>
                    <span className="font-medium">{t(`sample.exercises.${e.exercise}`)}</span>
                    <br />
                    <span className="text-ink/70 tabular-nums dark:text-paper/70">
                      {e.weightKg === 0
                        ? t('sample.setsBodyweight', { sets: e.sets, reps: e.reps })
                        : t('sample.sets', {
                            sets: e.sets,
                            reps: e.reps,
                            weight: number.format(e.weightKg),
                          })}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-ink/10 pt-2 text-xs text-ink/60 tabular-nums dark:border-paper/10 dark:text-paper/60">
                {t('sample.volume', { weight: number.format(workoutVolume(workout)) })}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold">{t('home.soonTitle')}</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {(['log', 'history', 'progress', 'leaderboards'] as const).map((key) => (
            <li key={key}>{t(`home.soon.${key}`)}</li>
          ))}
        </ul>
      </section>
    </>
  );
}

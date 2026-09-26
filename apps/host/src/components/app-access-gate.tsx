import { DevQuakeLogo, buttonClass, localizePath } from '@devquake/ui';
import { ProjectAvatar } from '@/components/project-avatar';
import { appIdentity } from '@/lib/app-icons';
import { startTrialAction } from '@/lib/trial-actions';
import { TRIAL_DATA_KEEP_DAYS, TRIAL_HOURS } from '@/lib/trial-rules';
import { getLocale, getT } from '@/i18n/server';

/**
 * Shown on an app subdomain instead of the app when the visitor may not use it yet: not signed
 * in, signed in but not subscribed (with the one 24-hour trial when it is still available, ADR
 * 0016), or after the trial ended. Links go to the main site, in the page language.
 */
export async function AppAccessGate({
  reason,
  projectName,
  projectId,
  canTry,
  pluginId,
  hostUrl,
  appUrl,
}: {
  reason: 'signin' | 'subscribe' | 'trial-ended' | 'unavailable';
  projectName: string;
  projectId?: number;
  canTry?: boolean;
  pluginId: string;
  hostUrl: string;
  /** Where to come back to after signing in. */
  appUrl: string;
}) {
  const [t, tc, locale, identity] = await Promise.all([
    getT('landing.gate'),
    getT('common'),
    getLocale(),
    appIdentity(pluginId, projectName),
  ]);
  const onHost = (path: string) => `${hostUrl}${localizePath(path, locale)}`;
  const back = localizePath('/', locale) === '/' ? appUrl : `${appUrl}${localizePath('/', locale)}`;
  const subscribeLink = (
    <a
      href={`${onHost('/account')}#available-projects`}
      className={buttonClass(canTry ? 'secondary' : 'primary', 'gap-2 text-base')}
    >
      {t('subscribeButton')} <span aria-hidden>→</span>
    </a>
  );
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-16 text-ink dark:bg-ink dark:text-paper">
      <section className="w-full max-w-md rounded-lg border border-ink/10 border-t-4 border-t-quake bg-white p-8 shadow-sm dark:border-paper/10 dark:border-t-quake dark:bg-paper/5">
        <a href={onHost('/')} aria-label={tc('home')}>
          <DevQuakeLogo size={32} />
        </a>
        <h1 className="mt-6 flex items-center gap-3 font-display text-2xl tracking-tight">
          <ProjectAvatar
            project={{
              name: identity.name,
              color: identity.look.background,
              symbol: identity.look.symbol,
            }}
            size={40}
            className="mr-1 mb-1"
          />
          {projectName}
        </h1>
        {reason === 'unavailable' ? (
          <>
            <p className="mt-2 text-ink/80 dark:text-paper/80">{t('unavailableBody')}</p>
            <a href={back} className={buttonClass('primary', 'mt-6 gap-2 text-base')}>
              {t('unavailableButton')}
            </a>
          </>
        ) : reason === 'signin' ? (
          <>
            <p className="mt-2 text-ink/80 dark:text-paper/80">{t('signinBody')}</p>
            <a
              href={`${onHost('/')}?next=${encodeURIComponent(back)}#account`}
              className={buttonClass('primary', 'mt-6 gap-2 text-base')}
            >
              {t('signinButton')} <span aria-hidden>→</span>
            </a>
          </>
        ) : reason === 'trial-ended' ? (
          <>
            <p className="mt-2 text-ink/80 dark:text-paper/80">
              {t('trialEndedBody', { name: projectName, days: TRIAL_DATA_KEEP_DAYS })}
            </p>
            <div className="mt-6">{subscribeLink}</div>
          </>
        ) : (
          <>
            <p className="mt-2 text-ink/80 dark:text-paper/80">
              {t('subscribeBody', { name: projectName })}
            </p>
            {canTry && projectId ? (
              <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">
                {t('trialBody', { hours: TRIAL_HOURS })}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {canTry && projectId ? (
                <form action={startTrialAction.bind(null, projectId)}>
                  <button type="submit" className={buttonClass('primary', 'gap-2 text-base')}>
                    {t('trialButton', { hours: TRIAL_HOURS })}
                  </button>
                </form>
              ) : null}
              {subscribeLink}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

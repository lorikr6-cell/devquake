import { DevQuakeLogo, buttonClass, localizePath } from '@devquake/ui';
import { getLocale, getT } from '@/i18n/server';

/**
 * Shown on an app subdomain instead of the app when the visitor may not use it yet:
 * not signed in, or signed in but not subscribed. Links go to the main site, in the page
 * language.
 */
export async function AppAccessGate({
  reason,
  projectName,
  hostUrl,
  appUrl,
}: {
  reason: 'signin' | 'subscribe';
  projectName: string;
  hostUrl: string;
  /** Where to come back to after signing in. */
  appUrl: string;
}) {
  const [t, tc, locale] = await Promise.all([getT('landing.gate'), getT('common'), getLocale()]);
  const onHost = (path: string) => `${hostUrl}${localizePath(path, locale)}`;
  const back = localizePath('/', locale) === '/' ? appUrl : `${appUrl}${localizePath('/', locale)}`;
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-16 text-ink dark:bg-ink dark:text-paper">
      <section className="w-full max-w-md rounded-lg border border-ink/10 border-t-4 border-t-quake bg-white p-8 shadow-sm dark:border-paper/10 dark:border-t-quake dark:bg-paper/5">
        <a href={onHost('/')} aria-label={tc('home')}>
          <DevQuakeLogo size={32} />
        </a>
        <h1 className="mt-6 font-display text-2xl tracking-tight">{projectName}</h1>
        {reason === 'signin' ? (
          <>
            <p className="mt-2 text-ink/80 dark:text-paper/80">{t('signinBody')}</p>
            <a
              href={`${onHost('/')}?next=${encodeURIComponent(back)}#account`}
              className={buttonClass('primary', 'mt-6 gap-2 text-base')}
            >
              {t('signinButton')} <span aria-hidden>→</span>
            </a>
          </>
        ) : (
          <>
            <p className="mt-2 text-ink/80 dark:text-paper/80">
              {t('subscribeBody', { name: projectName })}
            </p>
            <a
              href={`${onHost('/account')}#available-projects`}
              className={buttonClass('primary', 'mt-6 gap-2 text-base')}
            >
              {t('subscribeButton')} <span aria-hidden>→</span>
            </a>
          </>
        )}
      </section>
    </main>
  );
}

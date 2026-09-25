import type { PluginLayoutProps } from '@devquake/plugin-sdk';
import { DevQuakeMark, I18nProvider, LanguagePicker, Link, ReleaseNotes } from '@devquake/ui';
import { VoiceMenu } from './components/voice';
import { FALLBACK_MESSAGES, appMessages, localeOf, translator } from './i18n';

export default function Layout({ children, ctx }: PluginLayoutProps) {
  const locale = localeOf(ctx);
  const t = translator(locale);
  const appName = t('appName');
  const signedIn = Boolean(ctx.user && ctx.db);
  const sections = [
    ['/', t('nav.dashboard')],
    ['/plan', t('nav.plan')],
    ['/history', t('nav.calendar')],
    ['/progress', t('nav.progress')],
    ['/profile', t('nav.profile')],
  ] as const;
  return (
    <I18nProvider locale={locale} messages={appMessages(locale)} fallback={FALLBACK_MESSAGES}>
      <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
        <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-paper/10 dark:bg-ink/90">
          <nav className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 text-sm sm:gap-4 sm:px-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-display text-lg font-bold"
            >
              {ctx.app ? (
                // The app's logo from DevQuake (ADR 0016); decorative next to the name.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ctx.app.iconUrl}
                  alt=""
                  width={28}
                  height={28}
                  className="size-7 shrink-0"
                />
              ) : null}
              {appName}
            </Link>
            <ReleaseNotes
              entries={ctx.changelog ?? []}
              title={appName}
              className="hidden sm:inline-block"
            />
            <Link
              href="/help"
              aria-label={t('nav.manual')}
              className="ml-auto inline-flex items-center gap-1 text-ink/70 hover:text-quake dark:text-paper/70"
            >
              <span
                aria-hidden
                className="inline-flex size-5 items-center justify-center rounded-full border border-current text-xs font-bold"
              >
                ?
              </span>
              <span className="hidden sm:inline">{t('nav.manual')}</span>
            </Link>
            <LanguagePicker label={t('nav.language')} />
            <span className="hidden text-ink/60 md:inline dark:text-paper/60">
              {ctx.user?.displayName}
            </span>
            <a
              href={ctx.hostUrl}
              className="inline-flex items-center gap-2 text-ink/70 hover:text-quake dark:text-paper/70"
            >
              <DevQuakeMark size={20} title="" />
              <span className="hidden sm:inline">{t('nav.devquake')}</span>
            </a>
          </nav>
          {signedIn ? (
            <nav
              aria-label={t('nav.sections')}
              className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-2 pb-2 text-sm sm:px-4"
            >
              {sections.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="shrink-0 rounded-md px-3 py-2 font-medium text-ink/75 hover:bg-ink/5 hover:text-quake dark:text-paper/75 dark:hover:bg-paper/10"
                >
                  {label}
                </Link>
              ))}
              {/* Voice coach: mute and speech settings (ADR 0015). */}
              <VoiceMenu className="ml-auto shrink-0" />
            </nav>
          ) : null}
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>
        <footer className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-10 text-xs text-ink/60 sm:px-6 dark:text-paper/60">
          <span>{appName}</span>
          <ReleaseNotes entries={ctx.changelog ?? []} title={appName} />
          <Link href="/help" className="underline hover:text-quake">
            {t('nav.manual')}
          </Link>
          <a href={ctx.hostUrl} className="underline hover:text-quake">
            {t('nav.devquake')}
          </a>
        </footer>
      </div>
    </I18nProvider>
  );
}

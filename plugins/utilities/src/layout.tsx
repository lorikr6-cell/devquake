import type { PluginLayoutProps } from '@devquake/plugin-sdk';
import {
  DevQuakeMark,
  FullscreenButton,
  I18nProvider,
  LanguagePicker,
  Link,
  ReleaseNotes,
} from '@devquake/ui';
import { FALLBACK_MESSAGES, appMessages, localeOf, translator } from './i18n';

export default function Layout({ children, ctx }: PluginLayoutProps) {
  const locale = localeOf(ctx);
  const t = translator(locale);
  const appName = t('appName');
  return (
    <I18nProvider locale={locale} messages={appMessages(locale)} fallback={FALLBACK_MESSAGES}>
      <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
        <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-paper/10 dark:bg-ink/90">
          <nav className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 text-sm sm:gap-4 sm:px-6">
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
            <Link href="/" className="ml-auto text-ink/70 hover:text-quake dark:text-paper/70">
              {t('nav.bills')}
            </Link>
            {ctx.user ? (
              <Link href="/profile" className="text-ink/70 hover:text-quake dark:text-paper/70">
                {t('nav.profile')}
              </Link>
            ) : null}
            <Link
              href="/help"
              className="inline-flex items-center gap-1 text-ink/70 hover:text-quake dark:text-paper/70"
            >
              <span
                aria-hidden
                className="inline-flex size-5 items-center justify-center rounded-full border border-current text-xs font-bold"
              >
                ?
              </span>
              <span className="hidden sm:inline">{t('nav.manual')}</span>
            </Link>
            <FullscreenButton
              enterLabel={t('nav.fullscreen')}
              exitLabel={t('nav.exitFullscreen')}
            />
            <LanguagePicker label={t('nav.language')} />
            <a
              href={ctx.hostUrl}
              className="inline-flex items-center gap-2 text-ink/70 hover:text-quake dark:text-paper/70"
            >
              <DevQuakeMark size={20} title="" />
              <span className="hidden sm:inline">{t('nav.devquake')}</span>
            </a>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
        <footer className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-10 text-xs text-ink/60 sm:px-6 dark:text-paper/60">
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

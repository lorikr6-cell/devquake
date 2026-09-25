import type { PluginLayoutProps } from '@devquake/plugin-sdk';
import { DevQuakeMark, I18nProvider, LanguagePicker, Link, ReleaseNotes } from '@devquake/ui';
import { FALLBACK_MESSAGES, appMessages, localeOf, translator } from './i18n';

export default function Layout({ children, ctx }: PluginLayoutProps) {
  const locale = localeOf(ctx);
  const t = translator(locale);
  const appName = t('appName');
  return (
    <I18nProvider locale={locale} messages={appMessages(locale)} fallback={FALLBACK_MESSAGES}>
      <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
        <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-paper/10 dark:bg-ink/90">
          <nav className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 text-sm sm:gap-4 sm:px-6">
            <Link href="/" className="font-display text-lg font-bold">
              {appName}
            </Link>
            <ReleaseNotes
              entries={ctx.changelog ?? []}
              title={appName}
              className="hidden sm:inline-block"
            />
            <LanguagePicker label={t('nav.language')} className="ml-auto" />
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
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>
        <footer className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-10 text-xs text-ink/60 sm:px-6 dark:text-paper/60">
          <span>{appName}</span>
          <ReleaseNotes entries={ctx.changelog ?? []} title={appName} />
          <a href={ctx.hostUrl} className="underline hover:text-quake">
            {t('nav.devquake')}
          </a>
        </footer>
      </div>
    </I18nProvider>
  );
}

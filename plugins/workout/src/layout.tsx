import type { PluginLayoutProps } from '@devquake/plugin-sdk';
import { AppToolbar, I18nProvider, Link, ReleaseNotes } from '@devquake/ui';
import { VoiceConfigProvider, VoiceMenu } from './components/voice';
import { ttsConfigured } from './lib/tts-server';
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
      <VoiceConfigProvider natural={signedIn && ttsConfigured()}>
        <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
          <AppToolbar
            title={appName}
            iconUrl={ctx.app?.iconUrl}
            hostUrl={ctx.hostUrl}
            signedIn={Boolean(ctx.user)}
            labels={{
              fullscreen: t('nav.fullscreen'),
              exitFullscreen: t('nav.exitFullscreen'),
              language: t('nav.language'),
              devquake: t('nav.devquake'),
            }}
            // Voice coach: mute and speech settings, on the title row (ADR 0015).
            actions={signedIn ? <VoiceMenu className="shrink-0" /> : null}
          >
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
              </nav>
            ) : null}
          </AppToolbar>
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
      </VoiceConfigProvider>
    </I18nProvider>
  );
}

import type { PluginLayoutProps } from '@devquake/plugin-sdk';
import { AppToolbar, Link } from '@devquake/ui';

// Texts: give the app its own catalog with an I18nProvider here once it has more than a few
// words (see plugins/shopping/src/i18n and ADR 0011), and translate the toolbar labels below.
// The toolbar is shared by every app (AppToolbar): name and logo on the left (linking to the
// start page), full screen and the DevQuake mark on the right. The manual and the version notes
// go in the footer; signed-in people set language and theme in their DevQuake account.
export default function Layout({ children, ctx }: PluginLayoutProps) {
  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      <AppToolbar
        title="__PLUGIN_NAME__"
        iconUrl={ctx.app?.iconUrl}
        hostUrl={ctx.hostUrl}
        signedIn={Boolean(ctx.user)}
        labels={{
          fullscreen: 'Full screen',
          exitFullscreen: 'Exit full screen',
          language: 'Language',
          devquake: 'DevQuake',
        }}
      />
      <main className="mx-auto max-w-4xl px-6 py-12">{children}</main>
      <footer className="mx-auto flex max-w-4xl flex-wrap gap-x-3 px-6 pb-10 text-xs text-ink/60 dark:text-paper/60">
        <span>__PLUGIN_NAME__</span>
        <Link href="/about" className="underline hover:text-quake">
          About
        </Link>
      </footer>
    </div>
  );
}

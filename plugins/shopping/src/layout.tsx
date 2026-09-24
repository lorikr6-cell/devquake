import Link from 'next/link';
import type { PluginLayoutProps } from '@devquake/plugin-sdk';
import { DevQuakeMark, ReleaseNotes } from '@devquake/ui';
import { NotificationCenter } from './components/notification-center';

export default function Layout({ children, ctx }: PluginLayoutProps) {
  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-paper/10 dark:bg-ink/90">
        <nav className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 text-sm sm:gap-4 sm:px-6">
          <Link href="/" className="font-display text-lg font-bold">
            Shopping lists
          </Link>
          <ReleaseNotes
            entries={ctx.changelog ?? []}
            title="Shopping lists"
            className="hidden sm:inline-block"
          />
          <Link href="/" className="ml-auto text-ink/70 hover:text-quake dark:text-paper/70">
            Lists
          </Link>
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
            Manual
          </Link>
          {ctx.user && ctx.db ? <NotificationCenter /> : null}
          <span className="hidden text-ink/60 md:inline dark:text-paper/60">
            {ctx.user?.displayName}
          </span>
          <a
            href={ctx.hostUrl}
            className="inline-flex items-center gap-2 text-ink/70 hover:text-quake dark:text-paper/70"
          >
            <DevQuakeMark size={20} title="" />
            <span className="hidden sm:inline">DevQuake</span>
          </a>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>
      <footer className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-10 text-xs text-ink/60 sm:px-6 dark:text-paper/60">
        <span>Shopping lists</span>
        <ReleaseNotes entries={ctx.changelog ?? []} title="Shopping lists" />
        <Link href="/help" className="underline hover:text-quake">
          User manual
        </Link>
        <a href={ctx.hostUrl} className="underline hover:text-quake">
          DevQuake
        </a>
      </footer>
    </div>
  );
}

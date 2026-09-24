import Link from 'next/link';
import type { PluginLayoutProps } from '@devquake/plugin-sdk';
import { DevQuakeMark } from '@devquake/ui';

export default function Layout({ children, ctx }: PluginLayoutProps) {
  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-paper/10 dark:bg-ink/90">
        <nav className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3 text-sm sm:px-6">
          <Link href="/" className="font-display text-lg font-bold">
            Shopping lists
          </Link>
          <span className="ml-auto hidden text-ink/60 sm:inline dark:text-paper/60">
            {ctx.user?.displayName}
          </span>
          <a
            href={ctx.hostUrl}
            className="inline-flex items-center gap-2 text-ink/70 hover:text-quake dark:text-paper/70"
          >
            <DevQuakeMark size={20} title="" />
            DevQuake
          </a>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

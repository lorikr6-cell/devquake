import Link from 'next/link';
import type { PluginLayoutProps } from '@devquake/plugin-sdk';
import { DevQuakeMark } from '@devquake/ui';

export default function Layout({ children, ctx }: PluginLayoutProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="mx-auto flex max-w-4xl items-center gap-6 px-6 py-4 text-sm">
          <Link href="/" className="font-semibold">
            Example
          </Link>
          <Link href="/about">About</Link>
          <a href={ctx.hostUrl} className="ml-auto inline-flex items-center gap-2 text-zinc-500">
            <DevQuakeMark size={20} title="" />
            DevQuake
          </a>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-12">{children}</main>
    </div>
  );
}

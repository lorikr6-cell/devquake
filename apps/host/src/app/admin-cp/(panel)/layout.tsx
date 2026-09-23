import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@devquake/ui';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { logoutAction } from '../actions';

const nav = [
  { href: `${ADMIN_BASE}/dashboard`, label: 'Dashboard' },
  { href: `${ADMIN_BASE}/ideas`, label: 'Ideas' },
  { href: `${ADMIN_BASE}/projects`, label: 'Projects' },
  { href: `${ADMIN_BASE}/activity`, label: 'Activity log' },
];

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  return (
    <>
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="font-semibold">DevQuake CP</span>
          <nav className="flex flex-wrap gap-1 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">{admin.displayName}</span>
            <form action={logoutAction}>
              <Button type="submit" variant="secondary" className="px-3 py-1.5">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}

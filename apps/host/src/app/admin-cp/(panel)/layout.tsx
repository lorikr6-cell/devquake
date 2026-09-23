import Link from 'next/link';
import type { ReactNode } from 'react';
import { DevQuakeLogo } from '@devquake/ui';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { logoutAction } from '../actions';
import { AdminNav } from '../_components/admin-nav';

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
      {/* Brand bar: Ink in both themes, so the mark's ring is Paper and the tail stays orange. */}
      <header className="bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link
            href={`${ADMIN_BASE}/dashboard`}
            className="inline-flex items-center gap-3"
            aria-label="DevQuake control panel"
          >
            <DevQuakeLogo size={28} />
            <span className="rounded border border-paper/25 px-1.5 py-0.5 text-[11px] font-medium tracking-wider text-paper/70 uppercase">
              CP
            </span>
          </Link>
          <AdminNav items={nav} />
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-paper/70">{admin.displayName}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-paper/25 px-3 py-1.5 text-paper transition-colors hover:bg-paper/10 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}

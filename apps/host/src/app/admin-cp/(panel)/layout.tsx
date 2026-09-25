import Link from 'next/link';
import type { ReactNode } from 'react';
import { DevQuakeLogo } from '@devquake/ui';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { countNewMessages } from '@/lib/contact';
import { signOutAction } from '@/lib/auth/actions';
import { AdminNavStrip, AdminSidebar, type AdminNavGroup } from '../_components/admin-nav';
import { ThemePicker } from '@/components/theme-picker';
import { sharedCookieDomain } from '@/lib/domain';
import { getTheme } from '@/lib/theme-server';

const adminNav = [
  { href: `${ADMIN_BASE}/dashboard`, label: 'Dashboard' },
  { href: `${ADMIN_BASE}/ideas`, label: 'Ideas' },
  { href: `${ADMIN_BASE}/projects`, label: 'Projects' },
  { href: `${ADMIN_BASE}/community`, label: 'Community ideas' },
];

// Owner-only sections: personal data of every user (accounts, IPs, locations).
const ownerNav = (newMessages: number) => [
  { href: `${ADMIN_BASE}/users`, label: 'Users' },
  { href: `${ADMIN_BASE}/messages`, label: newMessages ? `Messages (${newMessages})` : 'Messages' },
  { href: `${ADMIN_BASE}/statistics`, label: 'Statistics' },
  { href: `${ADMIN_BASE}/activity`, label: 'Activity log' },
];

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const newMessages = admin.isOwner ? await countNewMessages().catch(() => 0) : 0;
  const theme = await getTheme();
  const groups: AdminNavGroup[] = [
    { title: 'Workspace', items: adminNav },
    ...(admin.isOwner ? [{ title: 'Owner only', items: ownerNav(newMessages) }] : []),
  ];

  return (
    <>
      {/* Brand bar: Ink in both themes, so the mark's ring is Paper and the tail stays orange. */}
      <header className="sticky top-0 z-40 bg-ink text-paper shadow-sm">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
          <Link
            href={`${ADMIN_BASE}/dashboard`}
            className="inline-flex items-center gap-3 justify-self-start"
            aria-label="DevQuake control panel"
          >
            <DevQuakeLogo size={28} />
            <span className="rounded border border-paper/25 px-1.5 py-0.5 text-[11px] font-medium tracking-wider text-paper/70 uppercase">
              CP
            </span>
          </Link>
          <ThemePicker initial={theme} cookieDomain={sharedCookieDomain()} tone="admin" />
          <div className="flex items-center justify-self-end gap-3 text-sm">
            <span className="hidden text-paper/70 sm:inline">
              {admin.displayName}
              <span className="ml-2 text-xs text-paper/50">
                {admin.isOwner ? 'Owner' : 'Admin'}
              </span>
            </span>
            <form action={signOutAction}>
              <input type="hidden" name="context" value="admin-cp" />
              <button
                type="submit"
                className="rounded-md border border-paper/25 px-3 py-1.5 whitespace-nowrap text-paper transition-colors hover:bg-paper/10 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-paper/10 lg:hidden">
          <AdminNavStrip groups={groups} />
        </div>
      </header>
      <div className="flex">
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-56 shrink-0 overflow-y-auto border-r border-ink/10 px-3 py-6 lg:block dark:border-paper/10">
          <AdminSidebar groups={groups} />
        </aside>
        <main className="min-w-0 flex-1 px-4 py-8 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </>
  );
}

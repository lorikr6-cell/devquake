import Link from 'next/link';
import type { ReactNode } from 'react';
import { DevQuakeLogo } from '@devquake/ui';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { countNewMessages } from '@/lib/contact';
import { signOutAction } from '@/lib/auth/actions';
import { SideNav, type SideNavGroup, type SideNavItem } from '@/components/side-nav';
import { isSideNavCollapsed } from '@/lib/side-nav-server';
import { ThemePicker } from '@/components/theme-picker';
import { sharedCookieDomain } from '@/lib/domain';
import { getTheme } from '@/lib/theme-server';

const adminNav: SideNavItem[] = [
  { href: `${ADMIN_BASE}/dashboard`, label: 'Dashboard', icon: 'dashboard' },
  { href: `${ADMIN_BASE}/ideas`, label: 'Ideas', icon: 'lightbulb' },
  { href: `${ADMIN_BASE}/projects`, label: 'Projects', icon: 'folder' },
  { href: `${ADMIN_BASE}/community`, label: 'Community ideas', icon: 'community' },
];

// Owner-only sections: personal data of every user (accounts, IPs, locations).
const ownerNav = (newMessages: number): SideNavItem[] => [
  { href: `${ADMIN_BASE}/users`, label: 'Users', icon: 'users' },
  { href: `${ADMIN_BASE}/messages`, label: 'Messages', icon: 'mail', badge: newMessages },
  { href: `${ADMIN_BASE}/statistics`, label: 'Statistics', icon: 'chart' },
  { href: `${ADMIN_BASE}/activity`, label: 'Activity log', icon: 'activity' },
];

// Height of the sticky brand bar: the sidebar and the phone menu bar stick below it.
const HEADER_HEIGHT = 58;

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const newMessages = admin.isOwner ? await countNewMessages().catch(() => 0) : 0;
  const [theme, collapsed] = await Promise.all([getTheme(), isSideNavCollapsed()]);
  const groups: SideNavGroup[] = [
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
      </header>
      <div className="lg:flex">
        <SideNav
          label="Control panel"
          groups={groups}
          initialCollapsed={collapsed}
          top={HEADER_HEIGHT}
        />
        <main className="min-w-0 flex-1 px-4 py-8 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </>
  );
}

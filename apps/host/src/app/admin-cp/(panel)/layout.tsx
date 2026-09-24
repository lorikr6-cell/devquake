import Link from 'next/link';
import type { ReactNode } from 'react';
import { DevQuakeLogo } from '@devquake/ui';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { countNewMessages } from '@/lib/contact';
import { signOutAction } from '@/lib/auth/actions';
import { AdminNav } from '../_components/admin-nav';

const adminNav = [
  { href: `${ADMIN_BASE}/dashboard`, label: 'Dashboard' },
  { href: `${ADMIN_BASE}/ideas`, label: 'Ideas' },
  { href: `${ADMIN_BASE}/projects`, label: 'Projects' },
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

  return (
    <>
      {/* Brand bar: Ink in both themes, so the mark's ring is Paper and the tail stays orange. */}
      <header className="sticky top-0 z-40 bg-ink text-paper shadow-sm">
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
          <AdminNav items={admin.isOwner ? [...adminNav, ...ownerNav(newMessages)] : adminNav} />
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-paper/70">
              {admin.displayName}
              <span className="ml-2 text-xs text-paper/50">
                {admin.isOwner ? 'Owner' : 'Admin'}
              </span>
            </span>
            <form action={signOutAction}>
              <input type="hidden" name="context" value="admin-cp" />
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

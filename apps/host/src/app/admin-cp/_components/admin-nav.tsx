'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@devquake/ui';

export interface AdminNavItem {
  href: string;
  label: string;
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Control panel navigation as a sidebar (large screens): grouped links, the current section
 * marked with a Quake-orange bar.
 */
export function AdminSidebar({ groups }: { groups: AdminNavGroup[] }) {
  const isActive = useActive();
  return (
    <nav aria-label="Control panel" className="space-y-6 text-sm">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-xs font-medium tracking-wider text-ink/50 uppercase dark:text-paper/50">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'block rounded-md border-l-4 px-3 py-2 transition-colors',
                      active
                        ? 'border-quake bg-ink/5 font-medium text-ink dark:bg-paper/10 dark:text-paper'
                        : 'border-transparent text-ink/70 hover:bg-ink/5 hover:text-ink dark:text-paper/70 dark:hover:bg-paper/10 dark:hover:text-paper',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** The same links as a scrollable strip for phones and tablets (no room for a sidebar). */
export function AdminNavStrip({ groups }: { groups: AdminNavGroup[] }) {
  const isActive = useActive();
  return (
    <nav
      aria-label="Control panel"
      className="flex gap-1 overflow-x-auto px-4 text-sm [scrollbar-width:none]"
    >
      {groups
        .flatMap((g) => g.items)
        .map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'shrink-0 border-b-2 px-3 py-2 whitespace-nowrap',
                active
                  ? 'border-quake text-paper'
                  : 'border-transparent text-paper/70 hover:text-paper',
              )}
            >
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}

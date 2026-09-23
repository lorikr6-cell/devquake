'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@devquake/ui';

export interface AdminNavItem {
  href: string;
  label: string;
}

/** Header navigation; the current section is marked with a Quake-orange underline. */
export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 text-sm">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'border-b-2 px-3 py-1.5 transition-colors',
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

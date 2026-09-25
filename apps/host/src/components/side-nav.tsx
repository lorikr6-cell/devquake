'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link, cn, stripLocale, useT } from '@devquake/ui';
import { Icon, type IconName } from '@/components/icons';
import { SIDENAV_COOKIE, SIDENAV_COOKIE_MAX_AGE } from '@/lib/side-nav';

export interface SideNavItem {
  /** A page ("/admin-cp/users") or a section of the current page ("#invite"). */
  href: string;
  label: string;
  icon: IconName;
  /** A count shown next to the label (or on the icon when collapsed), e.g. new messages. */
  badge?: number;
}

export interface SideNavGroup {
  title?: string;
  items: SideNavItem[];
}

const isSection = (href: string) => href.startsWith('#');

/**
 * The section of the page being read: the last one whose top has scrolled near the header (the
 * last one at the bottom of the page). A section chosen in the menu stays current until the
 * visitor scrolls themselves, so a short section near the end is highlighted too.
 */
function useCurrentSection(sectionKey: string, offset: number) {
  const [current, setCurrent] = useState<string | null>(null);
  const pinned = useRef<string | null>(null);
  useEffect(() => {
    const ids = sectionKey.split(' ').filter(Boolean);
    if (ids.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (pinned.current) return setCurrent(pinned.current);
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let found: string | null = ids[0] ?? null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset + 120) found = id;
      }
      setCurrent(atBottom ? (ids.at(-1) ?? found) : found);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const unpin = () => {
      pinned.current = null;
    };
    const fromHash = decodeURIComponent(location.hash.slice(1));
    if (ids.includes(fromHash)) pinned.current = fromHash;
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    for (const type of ['wheel', 'touchstart', 'keydown'] as const) {
      window.addEventListener(type, unpin, { passive: true });
    }
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      for (const type of ['wheel', 'touchstart', 'keydown'] as const) {
        window.removeEventListener(type, unpin);
      }
      if (frame) cancelAnimationFrame(frame);
    };
  }, [sectionKey, offset]);
  const pin = (id: string) => {
    pinned.current = id;
    setCurrent(id);
  };
  return [current, pin] as const;
}

/**
 * Sidebar navigation for the account dashboard and /admin-cp. Large screens: a sticky sidebar
 * that collapses to icons (the label then shows as a tooltip; the choice is remembered in a
 * cookie so the page renders at the right width). Phones and tablets: a menu button that slides
 * the same links in from the left. The current page or section is highlighted.
 */
export function SideNav({
  label,
  groups,
  initialCollapsed,
  top,
}: {
  /** Accessible name of the navigation, e.g. "Your account". */
  label: string;
  groups: SideNavGroup[];
  initialCollapsed: boolean;
  /** Height of the sticky page header in px: the sidebar and menu bar stick below it. */
  top: number;
}) {
  // The browser path includes the language prefix ("/de/account"); compare without it.
  const pathname = stripLocale(usePathname() ?? '/').path;
  const t = useT('common.sideNav');
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [open, setOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  const items = groups.flatMap((g) => g.items);
  // Ids of this page's sections, as one string so the scroll tracking is set up only once.
  const sectionKey = items
    .filter((i) => isSection(i.href))
    .map((i) => i.href.slice(1))
    .join(' ');
  const [section, pinSection] = useCurrentSection(sectionKey, top);

  const isActive = (href: string) =>
    isSection(href)
      ? section === href.slice(1)
      : pathname === href || pathname.startsWith(`${href}/`);
  const current = items.find((i) => isActive(i.href));

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDENAV_COOKIE}=${next ? 'collapsed' : 'expanded'}; path=/; max-age=${SIDENAV_COOKIE_MAX_AGE}; samesite=lax`;
  }

  // Drawer: Escape closes it, the page behind does not scroll, focus moves in and back out.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    closeButton.current?.focus();
    const menu = menuButton.current;
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      menu?.focus();
    };
  }, [open]);

  // A link to a collapsed section (<details>) opens it.
  function follow(event: MouseEvent<HTMLAnchorElement>, href: string) {
    setOpen(false);
    if (!isSection(href)) return;
    const target = document.getElementById(href.slice(1));
    if (target instanceof HTMLDetailsElement) target.open = true;
    if (target) {
      event.preventDefault();
      pinSection(target.id);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', href);
    }
  }

  const links = (compact: boolean) => (
    <div className="space-y-5">
      {groups.map((group, g) => (
        <div key={group.title ?? g}>
          {group.title ? (
            compact ? (
              g > 0 ? (
                <hr className="mx-3 mb-3 border-ink/10 dark:border-paper/10" />
              ) : null
            ) : (
              <p className="mb-1.5 px-3 text-xs font-medium tracking-wider text-ink/50 uppercase dark:text-paper/50">
                {group.title}
              </p>
            )
          ) : null}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={(e) => follow(e, item.href)}
                    aria-current={active ? (isSection(item.href) ? 'location' : 'page') : undefined}
                    className={cn(
                      'group/link relative flex items-center gap-3 rounded-md border-l-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-quake',
                      compact ? 'justify-center px-0' : 'px-3',
                      active
                        ? 'border-quake bg-quake/10 font-medium text-ink dark:bg-quake/15 dark:text-paper'
                        : 'border-transparent text-ink/70 hover:bg-ink/5 hover:text-ink dark:text-paper/70 dark:hover:bg-paper/10 dark:hover:text-paper',
                    )}
                  >
                    <span className="relative inline-flex">
                      <Icon
                        name={item.icon}
                        size={20}
                        className={cn('shrink-0', active && 'text-quake')}
                      />
                      {compact && item.badge ? (
                        <span className="absolute -top-1.5 -right-2 min-w-4 rounded-full bg-quake px-1 text-center text-[10px] leading-4 font-semibold text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </span>
                    <span className={compact ? 'sr-only' : 'min-w-0 flex-1 truncate'}>
                      {item.label}
                    </span>
                    {!compact && item.badge ? (
                      <span className="rounded-full bg-quake px-1.5 text-xs leading-5 font-semibold text-white">
                        {item.badge}
                      </span>
                    ) : null}
                    {compact ? (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-paper opacity-0 shadow-lg transition-opacity group-hover/link:opacity-100 group-focus-visible/link:opacity-100 dark:bg-paper dark:text-ink"
                      >
                        {item.label}
                        {item.badge ? ` (${item.badge})` : ''}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Phones and tablets: a bar with the menu button and where you are. */}
      <div
        className="sticky z-30 flex items-center gap-2 border-b border-ink/10 bg-paper/95 px-4 py-2 backdrop-blur lg:hidden dark:border-paper/10 dark:bg-ink/95"
        style={{ top }}
      >
        <button
          ref={menuButton}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="side-nav-drawer"
          className="inline-flex items-center gap-2 rounded-md border border-ink/15 px-3 py-1.5 text-sm font-medium hover:bg-ink/5 dark:border-paper/15 dark:hover:bg-paper/10"
        >
          <Icon name="menu" size={18} />
          {t('menu')}
        </button>
        {current ? (
          <span className="flex min-w-0 items-center gap-1.5 text-sm text-ink/70 dark:text-paper/70">
            <Icon name={current.icon} size={16} className="shrink-0 text-quake" />
            <span className="truncate">{current.label}</span>
          </span>
        ) : null}
      </div>

      <div
        id="side-nav-drawer"
        className={cn('fixed inset-0 z-50 lg:hidden', !open && 'pointer-events-none')}
        inert={!open}
      >
        <div
          aria-hidden
          onClick={() => setOpen(false)}
          className={cn(
            'absolute inset-0 bg-ink/50 transition-opacity duration-200',
            open ? 'opacity-100' : 'opacity-0',
          )}
        />
        <nav
          aria-label={label}
          className={cn(
            'absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-paper px-3 py-4 shadow-xl transition-transform duration-200 ease-out dark:bg-ink',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="mb-4 flex items-center justify-between px-3">
            <p className="font-display text-lg">{label}</p>
            <button
              ref={closeButton}
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('closeMenu')}
              className="rounded-md p-1.5 hover:bg-ink/5 dark:hover:bg-paper/10"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
          {links(false)}
        </nav>
      </div>

      {/* Large screens: the sidebar. The outer column draws the divider down the whole page;
          the sticky part is only as tall as its links, so it stays in view to the end. */}
      <div className="hidden shrink-0 border-r border-ink/10 lg:block dark:border-paper/10">
        <aside
          className={cn(
            'sticky py-5 transition-[width] duration-200',
            collapsed ? 'w-16 px-2' : 'w-60 overflow-y-auto px-3',
          )}
          style={{ top, maxHeight: `calc(100vh - ${top}px)` }}
        >
          <nav aria-label={label}>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-expanded={!collapsed}
              aria-label={collapsed ? t('expandLabel') : t('collapseLabel')}
              className={cn(
                'group/link relative mb-4 flex w-full items-center gap-3 rounded-md py-2 text-sm text-ink/60 hover:bg-ink/5 hover:text-ink dark:text-paper/60 dark:hover:bg-paper/10 dark:hover:text-paper',
                collapsed ? 'justify-center' : 'px-3',
              )}
            >
              <Icon name={collapsed ? 'chevrons-right' : 'chevrons-left'} size={18} />
              {collapsed ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-paper opacity-0 shadow-lg transition-opacity group-hover/link:opacity-100 group-focus-visible/link:opacity-100 dark:bg-paper dark:text-ink"
                >
                  {t('expand')}
                </span>
              ) : (
                <span>{t('collapse')}</span>
              )}
            </button>
            {links(collapsed)}
          </nav>
        </aside>
      </div>
    </>
  );
}

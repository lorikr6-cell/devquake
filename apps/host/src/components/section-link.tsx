'use client';

import type { MouseEvent, ReactNode } from 'react';
import { localizePath, stripLocale, useLocale } from '@devquake/ui';

/** Event the landing-page sign-in card listens to, so links can pick its tab. */
export const AUTH_TAB_EVENT = 'dq:auth-tab';
export type AuthTab = 'signin' | 'signup';

/**
 * Link to a section of the landing page, e.g. "/#contact" or "/#account".
 * On the landing page it scrolls there itself (every click, even when the URL already has that
 * hash, and below the sticky header thanks to the targets' scroll-margin) and can switch the
 * sign-in card's tab. On any other page it is an ordinary link to the landing page.
 */
export function SectionLink({
  href,
  tab,
  className,
  children,
}: {
  href: `/#${string}`;
  /** For "/#account": which tab of the sign-in card to show. */
  tab?: AuthTab;
  className?: string;
  children: ReactNode;
}) {
  const id = href.slice(2);
  const locale = useLocale();

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (tab) window.dispatchEvent(new CustomEvent<AuthTab>(AUTH_TAB_EVENT, { detail: tab }));
    const onLanding = stripLocale(window.location.pathname).path === '/';
    const target = onLanding ? document.getElementById(id) : null;
    if (!target || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    if (window.location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
  }

  return (
    <a href={localizePath(href, locale)} onClick={onClick} className={className}>
      {children}
    </a>
  );
}

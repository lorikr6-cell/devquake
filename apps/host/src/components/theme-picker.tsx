'use client';

import { useState } from 'react';
import { cn } from '@devquake/ui';
import { THEME_COOKIE, THEME_COOKIE_MAX_AGE, type Theme } from '@/lib/theme';

const OPTIONS: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
  {
    value: 'adaptive',
    label: 'Adaptive',
    // Half-filled circle: follows the device.
    icon: (
      <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 1.75a6.25 6.25 0 0 1 0 12.5Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: 'light',
    label: 'Light',
    icon: (
      <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
        <circle cx="8" cy="8" r="3" fill="currentColor" />
        <path
          d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: (
      <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
        <path d="M13.5 10.2A6 6 0 0 1 5.8 2.5a6 6 0 1 0 7.7 7.7Z" fill="currentColor" />
      </svg>
    ),
  },
];

/**
 * Theme switch in the site and admin headers: Adaptive (follows the device, default), Light or
 * Dark. The choice is applied at once (data-theme on <html>) and remembered in a cookie shared
 * with every *.devquake.com app, which the server reads so pages render in the right theme
 * without a flash. Built on native radio buttons, so keyboard and screen readers just work.
 */
export function ThemePicker({
  initial,
  cookieDomain,
  tone = 'site',
}: {
  initial: Theme;
  /** ".devquake.com" (shared with apps) or undefined on localhost. */
  cookieDomain?: string;
  /** 'admin' sits on the Ink header bar in both themes. */
  tone?: 'site' | 'admin';
}) {
  const [theme, setTheme] = useState<Theme>(initial);

  function choose(value: Theme) {
    setTheme(value);
    const root = document.documentElement;
    if (value === 'adaptive') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', value);
    const domain = cookieDomain ? `; domain=${cookieDomain}` : '';
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie =
      value === 'adaptive'
        ? `${THEME_COOKIE}=; Max-Age=0; path=/${domain}${secure}; SameSite=Lax`
        : `${THEME_COOKIE}=${value}; Max-Age=${THEME_COOKIE_MAX_AGE}; path=/${domain}${secure}; SameSite=Lax`;
  }

  const admin = tone === 'admin';
  return (
    <fieldset
      className={cn(
        'inline-flex items-center rounded-full border p-0.5',
        admin ? 'border-paper/25' : 'border-ink/15 dark:border-paper/20',
      )}
    >
      <legend className="sr-only">Theme</legend>
      {OPTIONS.map((o) => {
        const active = theme === o.value;
        return (
          <label
            key={o.value}
            title={o.label}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-quake',
              admin
                ? active
                  ? 'bg-paper text-ink'
                  : 'text-paper/70 hover:text-paper'
                : active
                  ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                  : 'text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper',
            )}
          >
            <input
              type="radio"
              name="dq-theme"
              value={o.value}
              checked={active}
              onChange={() => choose(o.value)}
              className="sr-only"
            />
            {o.icon}
            <span className={admin ? 'sr-only' : 'sr-only lg:not-sr-only'}>{o.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn, useT } from '@devquake/ui';
import { leaveSharedThemeAction, rememberThemeAction } from '@/lib/theme-actions';
import { type BuiltInTheme, type Theme } from '@/lib/theme';
import { saveThemeCookie, showBuiltInTheme, showCustomTheme } from '@/lib/theme-client';
import type { ThemeView, UserThemes } from '@/lib/user-themes';
import { ThemeEditor } from './theme/theme-editor';

const OPTIONS: Array<{ value: BuiltInTheme; icon: React.ReactNode }> = [
  {
    value: 'adaptive',
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
    icon: (
      <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
        <path d="M13.5 10.2A6 6 0 0 1 5.8 2.5a6 6 0 1 0 7.7 7.7Z" fill="currentColor" />
      </svg>
    ),
  },
];

const PALETTE = (
  <svg
    viewBox="0 0 16 16"
    width="15"
    height="15"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M8 1.75a6.25 6.25 0 1 0 0 12.5c.9 0 1.3-.6 1.3-1.2 0-.7-.6-1-.6-1.7 0-.7.6-1.2 1.3-1.2h1.5a3.25 3.25 0 0 0 3.25-3.25C14.75 4.2 11.8 1.75 8 1.75Z" />
    <circle cx="5" cy="7" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="7.5" cy="4.6" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="10.6" cy="5.4" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

/** Three dots in the theme's colours, for the menu. */
function Swatch({ theme }: { theme: ThemeView }) {
  const { background, text, accent } = theme.settings.colors;
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 overflow-hidden rounded-full ring-1 ring-ink/20 dark:ring-paper/30"
    >
      {[background, text, accent].map((c, i) => (
        <span key={i} className="size-3.5" style={{ background: c }} />
      ))}
    </span>
  );
}

/**
 * Theme switch in the site and admin headers: Adaptive (follows the device, default), Light or
 * Dark, shown as icons with their names as tooltips. Signed-in members also get their custom
 * themes (ADR 0017): made in a live-preview editor, shared with friends and family, deleted. The
 * choice is applied at once and remembered in a cookie shared with every *.devquake.com app,
 * which the server reads so pages render in the right theme without a flash.
 */
export function ThemePicker({
  initial,
  cookieDomain,
  tone = 'site',
  themes,
}: {
  initial: Theme;
  /** ".devquake.com" (shared with apps) or undefined on localhost. */
  cookieDomain?: string;
  /** 'admin' sits on the Ink header bar in both themes. */
  tone?: 'site' | 'admin';
  /** The signed-in member's own and shared themes; undefined when signed out. */
  themes?: UserThemes;
}) {
  const [theme, setTheme] = useState<Theme>(initial);
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState<ThemeView | 'new' | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useT('common.theme');
  const tc = useT('common.customTheme');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu when clicking elsewhere or pressing Escape.
  useEffect(() => {
    if (!menu) return;
    const close = (event: Event) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === 'Escape'
          : !menuRef.current?.contains(event.target as Node)
      ) {
        setMenu(false);
      }
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', close);
    };
  }, [menu]);

  // Signed in: the choice is also saved on the account and comes back at every sign-in.
  function remember(value: Theme) {
    if (themes) void rememberThemeAction(value).catch(() => {});
  }

  function chooseBuiltIn(value: BuiltInTheme) {
    setTheme(value);
    showBuiltInTheme(value);
    saveThemeCookie(value, cookieDomain);
    remember(value);
  }

  function chooseCustom(view: ThemeView) {
    const value = `custom-${view.id}` as const;
    setTheme(value);
    showCustomTheme(view.settings, String(view.id));
    saveThemeCookie(value, cookieDomain);
    remember(value);
    setMenu(false);
  }

  const admin = tone === 'admin';
  const customActive = theme.startsWith('custom-');
  const item = (active: boolean) =>
    cn(
      'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition-colors',
      admin
        ? active
          ? 'bg-paper text-ink'
          : 'text-paper/70 hover:text-paper'
        : active
          ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
          : 'text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper',
    );

  return (
    <div ref={menuRef} className="relative inline-flex">
      <fieldset
        className={cn(
          'inline-flex items-center rounded-full border p-0.5',
          admin ? 'border-paper/25' : 'border-ink/15 dark:border-paper/20',
        )}
      >
        <legend className="sr-only">{t('label')}</legend>
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            title={t(o.value)}
            className={cn(
              item(theme === o.value),
              'has-focus-visible:ring-2 has-focus-visible:ring-quake',
            )}
          >
            <input
              type="radio"
              name="dq-theme"
              value={o.value}
              checked={theme === o.value}
              onChange={() => chooseBuiltIn(o.value)}
              className="sr-only"
            />
            {o.icon}
            {/* The name is the tooltip (title) and is read by screen readers. */}
            <span className="sr-only">{t(o.value)}</span>
          </label>
        ))}
        {themes ? (
          <button
            type="button"
            title={tc('menu')}
            aria-label={tc('menu')}
            aria-haspopup="true"
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
            className={cn(
              item(customActive),
              'focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none',
            )}
          >
            {PALETTE}
          </button>
        ) : null}
      </fieldset>

      {menu && themes ? (
        <div className="absolute top-full left-1/2 z-50 mt-2 w-72 -translate-x-1/2 rounded-xl border border-ink/15 bg-white p-3 text-left text-sm text-ink shadow-xl dark:border-paper/15 dark:bg-ink dark:text-paper">
          <p className="px-1 text-xs font-semibold tracking-wide text-ink/60 uppercase dark:text-paper/60">
            {tc('mine')}
          </p>
          {themes.own.length === 0 ? (
            <p className="px-1 py-1.5 text-ink/60 dark:text-paper/60">{tc('none')}</p>
          ) : (
            <ul className="mt-1 space-y-0.5">
              {themes.own.map((view) => (
                <li key={view.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-pressed={theme === `custom-${view.id}`}
                    onClick={() => chooseCustom(view)}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-ink/5 aria-pressed:font-semibold dark:hover:bg-paper/10"
                  >
                    <Swatch theme={view} />
                    <span className="truncate">{view.name}</span>
                  </button>
                  <button
                    type="button"
                    title={tc('edit', { name: view.name })}
                    aria-label={tc('edit', { name: view.name })}
                    onClick={() => {
                      setEditing(view);
                      setMenu(false);
                    }}
                    className="rounded-md px-2 py-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink dark:text-paper/60 dark:hover:bg-paper/10 dark:hover:text-paper"
                  >
                    ✎
                  </button>
                </li>
              ))}
            </ul>
          )}
          {themes.shared.length ? (
            <>
              <p className="mt-3 px-1 text-xs font-semibold tracking-wide text-ink/60 uppercase dark:text-paper/60">
                {tc('sharedWithMe')}
              </p>
              <ul className="mt-1 space-y-0.5">
                {themes.shared.map((view) => (
                  <li key={view.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-pressed={theme === `custom-${view.id}`}
                      onClick={() => chooseCustom(view)}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-ink/5 aria-pressed:font-semibold dark:hover:bg-paper/10"
                    >
                      <Swatch theme={view} />
                      <span className="min-w-0">
                        <span className="block truncate">{view.name}</span>
                        <span className="block truncate text-xs font-normal text-ink/60 dark:text-paper/60">
                          {tc('sharedBy', { name: view.ownerName ?? '' })}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      title={tc('remove', { name: view.name })}
                      aria-label={tc('remove', { name: view.name })}
                      onClick={() =>
                        startTransition(async () => {
                          await leaveSharedThemeAction(view.id);
                          if (theme === `custom-${view.id}`) chooseBuiltIn('adaptive');
                          router.refresh();
                        })
                      }
                      className="rounded-md px-2 py-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink dark:text-paper/60 dark:hover:bg-paper/10 dark:hover:text-paper"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setEditing('new');
              setMenu(false);
            }}
            className="mt-3 w-full rounded-md border border-dashed border-ink/25 px-3 py-2 font-medium hover:bg-ink/5 dark:border-paper/25 dark:hover:bg-paper/10"
          >
            + {tc('create')}
          </button>
        </div>
      ) : null}

      {editing ? (
        <ThemeEditor
          key={editing === 'new' ? 'new' : editing.id}
          theme={editing === 'new' ? null : editing}
          isActive={editing !== 'new' && theme === `custom-${editing.id}`}
          cookieDomain={cookieDomain}
          onClose={(applied) => {
            setEditing(null);
            if (applied) setTheme(applied as Theme);
          }}
        />
      ) : null}
    </div>
  );
}

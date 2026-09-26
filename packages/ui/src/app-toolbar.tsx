import type { ReactNode } from 'react';
import { FullscreenButton } from './fullscreen';
import { LanguagePicker, Link } from './i18n-react';
import { DevQuakeMark } from './logo';

/**
 * The toolbar of every DevQuake app (plugin): the app's logo and name on the left, taking all
 * the room and linking to the app's start page; on the right only full screen, the app's own
 * buttons (for example its notification bell) and the DevQuake mark. Signed-in people choose
 * their language and theme in their DevQuake account, so the language picker is only here for
 * visitors who are not signed in. The manual and the version notes are in the app's footer.
 * `children` is an optional second row (for example the app's sections).
 */
export function AppToolbar({
  title,
  iconUrl,
  hostUrl,
  signedIn,
  labels,
  actions,
  children,
}: {
  title: string;
  /** The app's logo (ctx.app.iconUrl), decorative next to the name. */
  iconUrl?: string;
  /** DevQuake's address (ctx.hostUrl). */
  hostUrl: string;
  signedIn: boolean;
  labels: { fullscreen: string; exitFullscreen: string; language: string; devquake: string };
  /** The app's own buttons, before the DevQuake mark (e.g. its notification bell). */
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-paper/10 dark:bg-ink/90">
      <nav className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3 text-sm sm:gap-3 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center gap-2 font-display text-lg font-bold"
        >
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- the app's logo from DevQuake
            <img src={iconUrl} alt="" width={28} height={28} className="size-7 shrink-0" />
          ) : null}
          <span className="truncate">{title}</span>
        </Link>
        <FullscreenButton enterLabel={labels.fullscreen} exitLabel={labels.exitFullscreen} />
        {signedIn ? null : <LanguagePicker label={labels.language} />}
        {actions}
        <a
          href={hostUrl}
          aria-label={labels.devquake}
          title={labels.devquake}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-ink/70 hover:bg-ink/5 hover:text-quake dark:text-paper/70 dark:hover:bg-paper/10"
        >
          <DevQuakeMark size={22} title="" />
        </a>
      </nav>
      {children}
    </header>
  );
}

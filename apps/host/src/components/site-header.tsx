import Link from 'next/link';
import { DevQuakeLogo, DevQuakeMark } from '@devquake/ui';
import { SectionLink } from '@/components/section-link';
import { ThemePicker } from '@/components/theme-picker';
import { sharedCookieDomain } from '@/lib/domain';
import { getTheme } from '@/lib/theme-server';
import { signOutAction } from '@/lib/auth/actions';
import { getSessionUser } from '@/lib/auth/session';

/** Public site header. Never links to /admin-cp, even for administrators. */
export async function SiteHeader() {
  const [user, theme] = await Promise.all([getSessionUser().catch(() => null), getTheme()]);

  return (
    // Sticky: stays at the top while scrolling; the translucent Paper/Ink background keeps
    // content from showing through (anchors use scroll-mt-24 to clear it).
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/80 dark:border-paper/10 dark:bg-ink/90 dark:supports-[backdrop-filter]:bg-ink/80">
      {/* Three columns: logo | theme picker (always centred) | links and account. */}
      <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6">
        <Link href="/" aria-label="DevQuake home" className="justify-self-start">
          {/* Phones: the mark alone (brand rules allow it) so the toolbar fits. */}
          <DevQuakeMark size={30} title="" className="sm:hidden" />
          <span className="hidden sm:block">
            <DevQuakeLogo size={32} />
          </span>
        </Link>
        <ThemePicker initial={theme} cookieDomain={sharedCookieDomain()} />
        <div className="flex items-center justify-self-end gap-3 text-sm sm:gap-4">
          <SectionLink
            href="/#contact"
            className="hidden text-ink/70 hover:text-ink sm:inline dark:text-paper/70 dark:hover:text-paper"
          >
            Contact
          </SectionLink>
          {user ? (
            <>
              <Link
                href="/account"
                title={user.displayName}
                className="max-w-[10rem] truncate font-medium whitespace-nowrap underline decoration-quake/40 underline-offset-4 hover:decoration-quake"
              >
                <span className="sm:hidden">Account</span>
                <span className="hidden sm:inline">{user.displayName}</span>
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-ink/20 px-3 py-1.5 whitespace-nowrap hover:bg-ink/5 dark:border-paper/20 dark:hover:bg-paper/10"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <SectionLink
              href="/#account"
              tab="signin"
              className="rounded-md bg-ink px-3 py-1.5 font-medium whitespace-nowrap text-paper hover:bg-ink/85 dark:bg-paper dark:text-ink dark:hover:bg-paper/85"
            >
              Sign in
            </SectionLink>
          )}
        </div>
      </div>
    </header>
  );
}

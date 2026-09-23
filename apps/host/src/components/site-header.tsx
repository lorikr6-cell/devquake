import Link from 'next/link';
import { DevQuakeLogo } from '@devquake/ui';
import { signOutAction } from '@/lib/auth/actions';
import { getSessionUser } from '@/lib/auth/session';

/** Public site header. Never links to /admin-cp, even for administrators. */
export async function SiteHeader() {
  const user = await getSessionUser().catch(() => null);

  return (
    <header className="border-b border-ink/10 dark:border-paper/10">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
        <Link href="/" aria-label="DevQuake home">
          <DevQuakeLogo size={32} />
        </Link>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <Link
            href="/#contact"
            className="hidden text-ink/70 hover:text-ink sm:inline dark:text-paper/70 dark:hover:text-paper"
          >
            Contact
          </Link>
          {user ? (
            <>
              <Link
                href="/account"
                className="font-medium underline decoration-quake/40 underline-offset-4 hover:decoration-quake"
              >
                {user.displayName}
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-ink/20 px-3 py-1.5 hover:bg-ink/5 dark:border-paper/20 dark:hover:bg-paper/10"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/#account"
              className="rounded-md bg-ink px-3 py-1.5 font-medium text-paper hover:bg-ink/85 dark:bg-paper dark:text-ink dark:hover:bg-paper/85"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

import { DevQuakeLogo } from '@devquake/ui';

/**
 * Shown on an app subdomain instead of the app when the visitor may not use it yet:
 * not signed in, or signed in but not subscribed. Links go to the main site.
 */
export function AppAccessGate({
  reason,
  projectName,
  hostUrl,
}: {
  reason: 'signin' | 'subscribe';
  projectName: string;
  hostUrl: string;
}) {
  const button =
    'inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 font-medium text-paper hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none dark:bg-paper dark:text-ink dark:hover:bg-paper/85';
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-16 text-ink dark:bg-ink dark:text-paper">
      <section className="w-full max-w-md rounded-lg border border-ink/10 border-t-4 border-t-quake bg-white p-8 shadow-sm dark:border-paper/10 dark:border-t-quake dark:bg-paper/5">
        <a href={hostUrl} aria-label="DevQuake home">
          <DevQuakeLogo size={32} />
        </a>
        <h1 className="mt-6 font-display text-2xl tracking-tight">{projectName}</h1>
        {reason === 'signin' ? (
          <>
            <p className="mt-2 text-ink/80 dark:text-paper/80">
              This app is available to DevQuake members who subscribed to it. Sign in on
              devquake.com, subscribe to {projectName}, then come back here.
            </p>
            <a href={`${hostUrl}/#account`} className={`${button} mt-6`}>
              Sign in on DevQuake <span aria-hidden>→</span>
            </a>
          </>
        ) : (
          <>
            <p className="mt-2 text-ink/80 dark:text-paper/80">
              You are signed in, but not subscribed to {projectName} yet. Subscribe on your account
              page and the app opens right away.
            </p>
            <a href={`${hostUrl}/account#available-projects`} className={`${button} mt-6`}>
              Subscribe on DevQuake <span aria-hidden>→</span>
            </a>
          </>
        )}
      </section>
    </main>
  );
}

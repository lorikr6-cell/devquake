import { SectionLink } from '@/components/section-link';
import type { SessionUser } from '@/lib/auth/session';
import type { PublicProject } from '@/lib/public-projects';
import { subscribeAction, unsubscribeAction } from '@/lib/subscription-actions';

const primary =
  'inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none dark:bg-paper dark:text-ink dark:hover:bg-paper/85';
const secondary =
  'inline-flex items-center rounded-md border border-ink/20 px-3 py-2 text-sm hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none dark:border-paper/20 dark:hover:bg-paper/10';
const note = 'text-xs text-ink/70 dark:text-paper/70';

/**
 * What a visitor can do with a project (ADR 0006): sign in, subscribe, open (only when the app
 * is online and they are a member), or unsubscribe. Assigned projects are managed by the owner.
 */
export function ProjectActions({
  project,
  user,
  membership,
}: {
  project: PublicProject;
  user: SessionUser | null;
  membership: 'subscribed' | 'assigned' | undefined;
}) {
  if (!user) {
    return (
      <p className={note}>
        <SectionLink
          href="/#account"
          tab="signin"
          className="font-medium underline decoration-quake underline-offset-2"
        >
          Sign in
        </SectionLink>{' '}
        to subscribe.{' '}
        {project.url
          ? 'Subscribers can open the app right away.'
          : 'You get access as soon as the app goes live.'}
      </p>
    );
  }

  const canOpen = !!project.url && (!!membership || user.isAdmin);
  const openButton = canOpen ? (
    <a href={project.url!} className={primary}>
      Open {project.name} <span aria-hidden>→</span>
    </a>
  ) : null;

  if (!membership) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {openButton}
        <form action={subscribeAction.bind(null, project.id)}>
          <button type="submit" className={openButton ? secondary : primary}>
            Subscribe
          </button>
        </form>
        <p className={note}>
          {project.url
            ? 'Subscribe to open the app.'
            : 'You get access as soon as the app goes live.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {openButton}
      {!project.url && (
        <p className="inline-flex items-center gap-1.5 text-sm font-medium">
          <span aria-hidden className="text-emerald-700 dark:text-emerald-400">
            ✓
          </span>
          {membership === 'assigned' ? 'Assigned to you' : 'Subscribed'} — opens here when it is
          live
        </p>
      )}
      {membership === 'subscribed' ? (
        <form action={unsubscribeAction.bind(null, project.id)}>
          <button type="submit" className={secondary}>
            Unsubscribe
          </button>
        </form>
      ) : (
        project.url && <p className={note}>Assigned to you by the owner.</p>
      )}
    </div>
  );
}

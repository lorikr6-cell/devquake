import { Link, rich } from '@devquake/ui';
import { SectionLink } from '@/components/section-link';
import { getT } from '@/i18n/server';
import type { SessionUser } from '@/lib/auth/session';
import { NPS_START, missingPoints, subscriptionCost } from '@/lib/nps-rules';
import { getNps } from '@/lib/referrals';
import type { PublicProject } from '@/lib/public-projects';
import { subscribeAction } from '@/lib/subscription-actions';
import { UnsubscribeButton } from './unsubscribe-button';

const primary =
  'inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none dark:bg-paper dark:text-ink dark:hover:bg-paper/85';
const secondary =
  'inline-flex items-center rounded-md border border-ink/20 px-3 py-2 text-sm hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none dark:border-paper/20 dark:hover:bg-paper/10';
const note = 'text-xs text-ink/70 dark:text-paper/70';

/**
 * What a visitor can do with a project (ADR 0006): sign in, subscribe, open (only when the app
 * is online and they are a member), or unsubscribe. Assigned projects are managed by the owner.
 */
export async function ProjectActions({
  project,
  user,
  membership,
}: {
  project: PublicProject;
  user: SessionUser | null;
  membership: 'subscribed' | 'assigned' | undefined;
}) {
  const [t, tp] = await Promise.all([getT('landing.actions'), getT('landing.projects')]);
  if (!user) {
    return (
      <p className={note}>
        {rich(t('toSubscribe'), {
          link: (
            <SectionLink
              href="/#account"
              tab="signin"
              className="font-medium underline decoration-quake underline-offset-2"
            >
              {t('signIn')}
            </SectionLink>
          ),
        })}{' '}
        {project.url ? t('openRightAway') : t('accessWhenLive')}{' '}
        {t('startPoints', { count: NPS_START })}
      </p>
    );
  }

  const canOpen = !!project.url && (!!membership || user.isAdmin);
  const openButton = canOpen ? (
    <a href={project.url!} className={primary}>
      {tp('open', { name: project.name })} <span aria-hidden>→</span>
    </a>
  ) : null;

  if (!membership) {
    // NPS points (ADR 0012): the cost is paid from the member's balance when subscribing.
    const cost = subscriptionCost(project.npsCost, { isAdmin: user.isAdmin, assigned: false });
    const balance = await getNps(user.userId);
    const missing = missingPoints(balance, cost);
    const pointsLink = (
      <Link href="/account#nps" className="underline decoration-quake/50 underline-offset-2">
        {t('whatArePoints')}
      </Link>
    );
    return (
      <div className="flex flex-wrap items-center gap-3">
        {openButton}
        <form action={subscribeAction.bind(null, project.id)}>
          <button
            type="submit"
            disabled={missing > 0}
            className={`${openButton ? secondary : primary} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {cost === 0 ? t('subscribeFree') : t('subscribeFor', { count: cost })}
          </button>
        </form>
        <p className={note}>
          {missing > 0 ? (
            <>
              {t('notEnough', { count: missing })}{' '}
              {rich(t('earnMore'), {
                link: (
                  <Link
                    href="/account#invite"
                    className="font-medium underline decoration-quake underline-offset-2"
                  >
                    {t('earnLink')}
                  </Link>
                ),
              })}
            </>
          ) : (
            <>
              {project.url ? t('subscribeToOpen') : t('accessWhenLive')}
              {cost > 0 ? <> {t('balance', { count: balance })}</> : null}
            </>
          )}{' '}
          {pointsLink}
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
          {membership === 'assigned' ? t('assignedWaiting') : t('subscribedWaiting')}
        </p>
      )}
      {membership === 'subscribed' ? (
        <UnsubscribeButton
          projectId={project.id}
          projectName={project.name}
          className={secondary}
          paid={project.npsCost > 0}
        />
      ) : (
        project.url && <p className={note}>{t('assignedByOwner')}</p>
      )}
    </div>
  );
}

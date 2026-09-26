import { Link, rich } from '@devquake/ui';
import { SectionLink } from '@/components/section-link';
import { getT } from '@/i18n/server';
import type { SessionUser } from '@/lib/auth/session';
import { NPS_START, missingPoints, subscriptionCost } from '@/lib/nps-rules';
import { getNps } from '@/lib/referrals';
import type { PublicProject } from '@/lib/public-projects';
import { subscribeAction } from '@/lib/subscription-actions';
import { TrialButton } from '@/components/landing/trial-button';
import { getTrials } from '@/lib/trials';
import { TRIAL_DATA_KEEP_DAYS, TRIAL_HOURS, canStartTrial, trialState } from '@/lib/trial-rules';
import { UnsubscribeButton } from './unsubscribe-button';

const primary =
  'inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none dark:bg-paper dark:text-ink dark:hover:bg-paper/85';
const secondary =
  'inline-flex items-center rounded-md border border-ink/20 px-3 py-2 text-sm hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none dark:border-paper/20 dark:hover:bg-paper/10';
const note = 'text-xs text-ink/70 dark:text-paper/70';

/**
 * What a visitor can do with a project (ADR 0006): sign in, subscribe, try the app free for 24
 * hours once (ADR 0016), open (only when the app is online and they are a member or trying
 * it), or unsubscribe. Assigned projects are managed by the owner.
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
  // A project whose app is not live yet cannot be subscribed to or tried: nothing to open.
  if (!project.url && !membership) {
    return <p className={note}>{tp('notOpenYet')}</p>;
  }
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

  const trial = membership ? undefined : (await getTrials(user.userId)).get(project.id);
  const trialNow = trialState(trial, new Date());
  const canOpen = !!project.url && (!!membership || user.isAdmin || trialNow.kind === 'active');
  const openButton = canOpen ? (
    <a href={project.url!} target="_blank" rel="noopener" className={primary}>
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
    const tryable = canStartTrial({
      appOnline: !!project.url && !!project.pluginId,
      isAdmin: user.isAdmin,
      member: false,
      trial,
    });
    // Not subscribed: no "Open" here (apps open for their subscribers). The way in is the
    // 24-hour trial, and during it a link back to the app.
    const continueTrial =
      trialNow.kind === 'active' && project.url ? (
        <a href={project.url} target="_blank" rel="noopener" className={primary}>
          {t('continueTrial')} <span aria-hidden>→</span>
        </a>
      ) : null;
    return (
      <div className="flex flex-wrap items-center gap-3">
        {continueTrial}
        {trialNow.kind === 'active' ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-quake/10 px-2.5 py-1 text-xs font-semibold text-ink dark:bg-quake/20 dark:text-paper">
            <span aria-hidden>⏱</span>
            {t('trialActive', { count: trialNow.hoursLeft })}
          </span>
        ) : null}
        {tryable ? (
          <TrialButton projectId={project.id} className={primary}>
            {t('tryFor', { hours: TRIAL_HOURS })}
          </TrialButton>
        ) : null}
        <form action={subscribeAction.bind(null, project.id)}>
          <button
            type="submit"
            disabled={missing > 0}
            className={`${continueTrial || tryable ? secondary : primary} disabled:cursor-not-allowed disabled:opacity-50`}
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
        {tryable ? (
          <p className={note}>{t('tryNote', { hours: TRIAL_HOURS, days: TRIAL_DATA_KEEP_DAYS })}</p>
        ) : trialNow.kind === 'ended' ? (
          <p className={note}>{t('trialEnded', { days: TRIAL_DATA_KEEP_DAYS })}</p>
        ) : null}
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

import { CollapsibleSection } from '@/components/account/collapsible-section';
import { DateTime } from '@/components/date-time';
import { ownerSuccession } from '@/lib/account-deletion';
import { RetentionNote } from '@/components/retention-note';
import { RETENTION_DAYS } from '@/lib/retention';
import { Card, Link, rich, type Translate } from '@devquake/ui';
import { getT } from '@/i18n/server';
import { AvatarEditor } from '@/components/account/avatar-editor';
import { CopyButton } from '@/components/account/copy-button';
import { DeleteAccount } from '@/components/account/delete-account';
import { InviteForm } from '@/components/account/invite-form';
import { ProjectActions } from '@/components/landing/project-actions';
import { ProjectCard } from '@/components/landing/project-card';
import { ProjectFeedback } from '@/components/landing/project-feedback';
import { requireUser } from '@/lib/auth/admin';
import { CONTACT_EMAIL } from '@/lib/mail/templates';
import {
  getMemberSince,
  getUserProjects,
  listAccountEvents,
  listSnapshots,
  type AccountEventRow,
} from '@/lib/admin/users';
import { emailLinkClass } from '@/components/form-styles';
import { myFeedback } from '@/lib/project-feedback';
import { listPublicProjects } from '@/lib/public-projects';
import { avatarVersion } from '@/lib/avatars';
import {
  getNps,
  getOrCreateReferralCode,
  listInvites,
  referralUrl,
  type InviteRow,
} from '@/lib/referrals';
import { getMemberships } from '@/lib/subscriptions';
import { ProjectAvatar } from '@/components/project-avatar';
import { ProjectAvatarEditor } from '@/components/project-avatar-editor';
import { AccountShell } from '@/components/account/account-shell';
import { avatarChoices, managedProjectIds, type AvatarChoice } from '@/lib/project-avatars';

export async function generateMetadata() {
  return { title: (await getT('account'))('metaTitle'), robots: { index: false } };
}

// All times on this page are in the visitor's own time zone (<DateTime>, ADR 0010).

/** Plain-language text for an account event; `warn` marks security-relevant failures. */
function describeEvent(t: Translate, e: AccountEventRow): { text: string; warn?: boolean } {
  const m = e.message;
  const ev = (key: string, params?: Record<string, string>) => t(`activity.events.${key}`, params);
  switch (e.action) {
    case 'auth.signup.started':
      return { text: ev('signupStarted') };
    case 'auth.signup.activated':
      return { text: ev('activated') };
    case 'auth.signin.success':
      return { text: e.source === 'admin-cp' ? ev('signedInCp') : ev('signedIn') };
    case 'auth.signout':
      return { text: ev('signedOut') };
    case 'auth.signin.failed':
      return { text: ev('failed'), warn: true };
    case 'auth.signin.locked':
      return { text: ev('refusedLocked'), warn: true };
    case 'auth.account.locked':
      return { text: ev('locked'), warn: true };
    case 'auth.code.failed':
      return { text: ev('codeFailed'), warn: true };
    case 'project.subscribed':
      return { text: m ? ev('subscribed', { name: m }) : ev('subscribedSome') };
    case 'project.unsubscribed':
      return { text: m ? ev('unsubscribed', { name: m }) : ev('unsubscribedSome') };
    case 'contact.received':
      return { text: m ? ev('messageSent', { subject: m }) : ev('messageSentSome') };
    case 'referral.invited':
      return { text: m ? ev('invited', { email: m }) : ev('invitedSome') };
    case 'referral.joined':
      return { text: ev('joined') };
    case 'user.updated':
      return { text: ev('updatedByAdmin', { change: m ?? '' }) };
    default:
      return { text: e.action };
  }
}

function InviteStatus({ invite, t }: { invite: InviteRow; t: Translate }) {
  if (invite.status === 'joined') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-950 dark:bg-emerald-900/60 dark:text-emerald-100">
        {t('invitations.joined')}
      </span>
    );
  }
  if (invite.status === 'signed_up') {
    return (
      <span className="text-xs text-ink/70 dark:text-paper/70">{t('invitations.signedUp')}</span>
    );
  }
  return (
    <span className="text-xs text-ink/60 dark:text-paper/60">
      {t('invitations.invitationSent')}
    </span>
  );
}

/** For users who manage a project: change its logo (admins can in /admin-cp too). */
function LogoManager({
  projectId,
  project,
  choice,
  t,
}: {
  projectId: number;
  project: { name: string; slug: string; pluginId: string | null; description: string | null };
  choice: AvatarChoice;
  t: Translate;
}) {
  return (
    <details className="mt-4 rounded-md border border-ink/10 dark:border-paper/10">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
        {t('projects.customizeLogo')}{' '}
        <span className="font-normal text-ink/60 dark:text-paper/60">
          {t('projects.youManage')}
        </span>
      </summary>
      <div className="border-t border-ink/10 p-3 dark:border-paper/10">
        <ProjectAvatarEditor
          projectId={projectId}
          project={project}
          color={choice.color}
          symbol={choice.symbol}
        />
      </div>
    </details>
  );
}

export default async function AccountPage() {
  const user = await requireUser();
  const t = await getT('account');
  const [
    assigned,
    signIns,
    publicProjects,
    memberships,
    memberSince,
    events,
    referralCode,
    nps,
    invites,
    avatar,
    feedback,
    managed,
    logos,
  ] = await Promise.all([
    getUserProjects(user.userId),
    listSnapshots({ userId: user.userId, limit: 10 }),
    listPublicProjects(),
    getMemberships(user.userId),
    getMemberSince(user.userId),
    listAccountEvents(user.userId, 10),
    getOrCreateReferralCode(user.userId),
    getNps(user.userId),
    listInvites(user.userId),
    avatarVersion(user.userId),
    myFeedback(user.userId).catch(() => new Map()),
    managedProjectIds(user.userId),
    avatarChoices(),
  ]);
  const inviteLink = referralUrl(referralCode);
  // A project appears in exactly one list: available (not a member) or yours.
  const available = publicProjects.filter((p) => !memberships.has(p.id));
  const mine = publicProjects.filter((p) => memberships.has(p.id));
  // Owner assignments to projects that are not public still belong to "Your projects".
  const publicIds = new Set(publicProjects.map((p) => p.id));
  const privateAssigned = assigned.filter((a) => !publicIds.has(a.project_id));
  const roleLabel = t(
    `profile.roles.${user.isOwner ? 'owner' : user.isAdmin ? 'admin' : 'member'}`,
  );
  // Owners may only leave when another owner or an admin can take over.
  const succession = user.isOwner ? await ownerSuccession(user.userId) : null;
  const manageLogo = (p: {
    id: number;
    name: string;
    slug: string;
    pluginId: string | null;
    description: string | null;
  }) =>
    managed.has(p.id) ? (
      <LogoManager
        projectId={p.id}
        project={p}
        choice={logos.get(p.id) ?? { color: null, symbol: null }}
        t={t}
      />
    ) : undefined;
  return (
    <AccountShell user={user} page="account">
      <h1 className="font-display text-3xl tracking-tight">{t('title')}</h1>

      <Card id="profile" className="mt-6 scroll-mt-24 bg-white dark:bg-paper/5">
        <AvatarEditor userId={user.userId} name={user.displayName} version={avatar} />
        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-ink/60 dark:text-paper/60">{t('profile.name')}</dt>
          <dd>{user.displayName}</dd>
          <dt className="text-ink/60 dark:text-paper/60">{t('profile.email')}</dt>
          <dd className="break-all">{user.email}</dd>
          <dt className="text-ink/60 dark:text-paper/60">{t('profile.role')}</dt>
          <dd>{roleLabel}</dd>
          <dt className="text-ink/60 dark:text-paper/60">{t('profile.memberSince')}</dt>
          <dd>
            <DateTime value={memberSince} style="long-date" />
          </dd>
          <dt className="text-ink/60 dark:text-paper/60">{t('profile.nps')}</dt>
          <dd>
            <a
              href="#invite"
              className="font-semibold underline decoration-quake/50 underline-offset-2"
            >
              {nps}
            </a>{' '}
            <span className="text-ink/60 dark:text-paper/60">
              {t('profile.npsJoined', { count: nps })}
            </span>
          </dd>
        </dl>
      </Card>

      <section id="invite" className="mt-10 scroll-mt-24">
        <h2 className="font-display text-xl tracking-tight">{t('invite.title')}</h2>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('invite.intro')}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-5 rounded-lg border border-ink/10 bg-white p-5 dark:border-paper/10 dark:bg-paper/5">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-5xl tabular-nums">{nps}</span>
              <span className="text-sm text-ink/70 dark:text-paper/70">
                NPS{' '}
                <span className="text-xs text-ink/50 dark:text-paper/50">
                  {t('invite.npsExplained')}
                </span>
              </span>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-ink/80 dark:text-paper/80">
                {t('invite.yourLink')}
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  aria-label={t('invite.yourLink')}
                  className="block w-full min-w-0 rounded-md border border-ink/20 bg-paper px-3 py-2 font-mono text-sm dark:border-paper/20 dark:bg-ink"
                />
                <CopyButton text={inviteLink} />
              </div>
            </div>
            <InviteForm />
          </div>
          <figure className="flex flex-col items-center rounded-lg border border-ink/10 bg-white p-5 dark:border-paper/10 dark:bg-paper/5">
            {/* Generated PNG from /r/<code>/qr. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/r/${referralCode}/qr`}
              width={168}
              height={168}
              alt={t('invite.qrAlt')}
              className="rounded-md bg-white p-1"
            />
            <figcaption className="mt-2 text-center text-xs text-ink/60 dark:text-paper/60">
              {t('invite.qrScan')}
              <br />
              <a
                href={`/r/${referralCode}/qr`}
                download={`devquake-invite-${referralCode}.png`}
                className="underline decoration-quake/50 underline-offset-2"
              >
                {t('invite.qrDownload')}
              </a>
            </figcaption>
          </figure>
        </div>
      </section>

      <section id="invitations" className="mt-10 scroll-mt-24">
        <h2 className="font-display text-xl tracking-tight">{t('invitations.title')}</h2>
        {invites.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">{t('invitations.none')}</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-ink/10 bg-white dark:border-paper/10 dark:bg-paper/5">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-ink/10 text-xs text-ink/60 dark:border-paper/10 dark:text-paper/60">
                <tr>
                  <th className="px-4 py-2 font-medium">{t('invitations.invited')}</th>
                  <th className="px-4 py-2 font-medium">{t('invitations.sent')}</th>
                  <th className="px-4 py-2 font-medium">{t('invitations.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5 dark:divide-paper/10">
                {invites.map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-2.5 break-all">
                      {i.email ??
                        (i.via_link ? t('invitations.viaLink') : t('invitations.deletedAccount'))}
                    </td>
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap text-ink/60 dark:text-paper/60">
                      <DateTime value={i.created_at} style="long-date" />
                    </td>
                    <td className="px-4 py-2.5">
                      <InviteStatus invite={i} t={t} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section id="available-projects" className="mt-10 scroll-mt-24">
        <h2 className="font-display text-xl tracking-tight">{t('projects.availableTitle')}</h2>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
          {t('projects.availableIntro')}
        </p>
        {available.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60 dark:text-paper/60">
            {t('projects.allSubscribed')}
          </p>
        ) : (
          <div className="mt-3 grid items-start gap-3 sm:grid-cols-2">
            {available.map((p) => (
              <ProjectCard
                key={p.id}
                id={`project-${p.id}`}
                project={p}
                membership={memberships.get(p.id)}
                footer={<ProjectActions project={p} user={user} membership={undefined} />}
                feedback={<ProjectFeedback project={p} user={user} mine={feedback.get(p.id)} />}
                manage={manageLogo(p)}
              />
            ))}
          </div>
        )}
      </section>

      <p className="mt-10 rounded-lg border border-ink/10 bg-white p-4 text-sm dark:border-paper/10 dark:bg-paper/5">
        {rich(t('projects.ideasBox'), {
          label: <span className="font-medium">{t('projects.ideasLabel')}</span>,
          link: (
            <Link href="/ideas?mine=1" className="underline decoration-quake/50 underline-offset-2">
              {t('projects.ideasLink')}
            </Link>
          ),
        })}
      </p>

      <section id="your-projects" className="mt-10 scroll-mt-24">
        <h2 className="font-display text-xl tracking-tight">{t('projects.yoursTitle')}</h2>
        {mine.length === 0 && privateAssigned.length === 0 ? (
          <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">{t('projects.none')}</p>
        ) : (
          <div className="mt-3 grid items-start gap-3 sm:grid-cols-2">
            {mine.map((p) => (
              <ProjectCard
                key={p.id}
                id={`project-${p.id}`}
                project={p}
                membership={memberships.get(p.id)}
                footer={
                  <ProjectActions project={p} user={user} membership={memberships.get(p.id)} />
                }
                feedback={<ProjectFeedback project={p} user={user} mine={feedback.get(p.id)} />}
                manage={manageLogo(p)}
              />
            ))}
            {privateAssigned.map((p) => {
              const project = {
                id: p.project_id,
                name: p.name,
                slug: p.slug,
                pluginId: p.plugin_id,
                description: p.description,
              };
              return (
                <Card key={p.project_id} className="bg-white dark:bg-paper/5">
                  <div className="flex items-start gap-3.5">
                    <ProjectAvatar
                      project={{ ...project, ...logos.get(p.project_id) }}
                      size={44}
                      className="mr-1 mb-1"
                    />
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">
                        {t('projects.assignedRole', {
                          role: t(`projects.roles.${p.project_role}`),
                        })}
                      </p>
                    </div>
                  </div>
                  {manageLogo(project)}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <CollapsibleSection
        id="account-activity"
        title={t('activity.title')}
        count={
          events.length ? t('activity.entries', { count: events.length }) : t('activity.noneYet')
        }
        warning={
          events.filter((e) => describeEvent(t, e).warn).length
            ? t('activity.toCheck', {
                count: events.filter((e) => describeEvent(t, e).warn).length,
              })
            : null
        }
      >
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
          {events.length === 10 ? t('activity.intro', { count: 10 }) : t('activity.introFew')}
        </p>
        <RetentionNote days={RETENTION_DAYS.accountActivity} what="accountActivity" />
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60 dark:text-paper/60">{t('activity.nothing')}</p>
        ) : (
          <ol className="mt-3 divide-y divide-ink/10 rounded-lg border border-ink/10 bg-white text-sm dark:divide-paper/10 dark:border-paper/10 dark:bg-paper/5">
            {events.map((e) => {
              const d = describeEvent(t, e);
              return (
                <li
                  key={e.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5"
                >
                  <span className={d.warn ? 'font-medium text-red-700 dark:text-red-400' : ''}>
                    {d.text}
                  </span>
                  <span className="text-xs text-ink/60 tabular-nums dark:text-paper/60">
                    <DateTime value={e.occurred_at} />
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        id="signin-activity"
        title={t('signins.title')}
        count={
          signIns.length ? t('signins.count', { count: signIns.length }) : t('signins.noneYet')
        }
        warning={
          signIns.filter((s) => s.outcome !== 'ok' && s.outcome !== 'code_sent').length
            ? t('signins.failedCount', {
                count: signIns.filter((s) => s.outcome !== 'ok' && s.outcome !== 'code_sent')
                  .length,
              })
            : null
        }
      >
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
          {rich(t('signins.unrecognised'), {
            email: (
              <a href={`mailto:${CONTACT_EMAIL}`} className={emailLinkClass}>
                {CONTACT_EMAIL}
              </a>
            ),
          })}
        </p>
        <RetentionNote days={RETENTION_DAYS.authSnapshots} what="signinActivity" />
        <ul className="mt-3 divide-y divide-ink/10 rounded-lg border border-ink/10 bg-white text-sm dark:divide-paper/10 dark:border-paper/10 dark:bg-paper/5">
          {signIns.map((s) => (
            <li key={s.id} className="flex flex-wrap justify-between gap-2 px-4 py-2.5">
              <span className="tabular-nums">
                <DateTime value={s.occurred_at} />
              </span>
              <span className="text-ink/70 dark:text-paper/70">
                {[s.city, s.country].filter(Boolean).join(', ') || t('signins.unknownLocation')}
                {s.is_proxy ? ` · ${t('signins.vpn')}` : ''} ·{' '}
                {s.browser ?? t('signins.unknownBrowser')}
                {s.outcome !== 'ok' && s.outcome !== 'code_sent' && (
                  <strong className="ml-1 text-red-700 dark:text-red-400">
                    {t('signins.failed')}
                  </strong>
                )}
              </span>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      <section
        id="delete-account"
        className="mt-14 rounded-lg border border-red-300 bg-red-50/60 p-5 dark:border-red-900 dark:bg-red-950/30"
      >
        <h2 className="font-display text-xl tracking-tight text-red-800 dark:text-red-300">
          {t('delete.title')}
        </h2>
        <p className="mt-1 mb-4 text-sm text-ink/80 dark:text-paper/80">{t('delete.intro')}</p>
        {succession?.kind === 'none' ? (
          <p className="text-sm font-medium text-red-800 dark:text-red-300">
            {t('delete.onlyOwner')}
          </p>
        ) : (
          <DeleteAccount
            ownerNote={
              succession?.kind === 'promote'
                ? t('delete.promote', { name: succession.displayName })
                : succession?.kind === 'other-owner'
                  ? t('delete.otherOwner')
                  : null
            }
          />
        )}
      </section>
    </AccountShell>
  );
}

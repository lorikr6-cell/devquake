import { Card } from '@devquake/ui';
import { AvatarEditor } from '@/components/account/avatar-editor';
import { CopyButton } from '@/components/account/copy-button';
import { DeleteAccount } from '@/components/account/delete-account';
import { InviteForm } from '@/components/account/invite-form';
import { ProjectActions } from '@/components/landing/project-actions';
import { ProjectCard } from '@/components/landing/project-card';
import { ProjectFeedback } from '@/components/landing/project-feedback';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
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

export const metadata = { title: 'Your account', robots: { index: false } };

const dateTime = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

const dateOnly = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' });

/** Plain-language text for an account event; `warn` marks security-relevant failures. */
function describeEvent(e: AccountEventRow): { text: string; warn?: boolean } {
  const m = e.message;
  switch (e.action) {
    case 'auth.signup.started':
      return { text: 'Account created' };
    case 'auth.signup.activated':
      return { text: 'Account activated from the welcome email' };
    case 'auth.signin.success':
      return { text: e.source === 'admin-cp' ? 'Signed in to the control panel' : 'Signed in' };
    case 'auth.signout':
      return { text: 'Signed out' };
    case 'auth.signin.failed':
      return { text: 'Failed sign-in attempt (wrong password)', warn: true };
    case 'auth.signin.locked':
      return { text: 'Sign-in refused: the account was locked', warn: true };
    case 'auth.account.locked':
      return { text: 'Account locked for 3 hours after failed sign-in attempts', warn: true };
    case 'auth.code.failed':
      return { text: 'Wrong sign-in code entered', warn: true };
    case 'project.subscribed':
      return { text: m ? `Subscribed to ${m}` : 'Subscribed to a project' };
    case 'project.unsubscribed':
      return { text: m ? `Unsubscribed from ${m}` : 'Unsubscribed from a project' };
    case 'contact.received':
      return { text: m ? `Sent a message: ${m}` : 'Sent a message' };
    case 'referral.invited':
      return { text: m ? `Invited ${m} to DevQuake` : 'Sent an invitation' };
    case 'referral.joined':
      return { text: 'Someone you invited joined DevQuake (+1 NPS)' };
    case 'user.updated':
      return { text: `An administrator updated your account: ${m}` };
    default:
      return { text: e.action };
  }
}

function InviteStatus({ invite }: { invite: InviteRow }) {
  if (invite.status === 'joined') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-950 dark:bg-emerald-900/60 dark:text-emerald-100">
        ✓ Joined · +1 NPS
      </span>
    );
  }
  if (invite.status === 'signed_up') {
    return (
      <span className="text-xs text-ink/70 dark:text-paper/70">
        Signed up, waiting for activation
      </span>
    );
  }
  return <span className="text-xs text-ink/60 dark:text-paper/60">Invitation sent</span>;
}

export default async function AccountPage() {
  const user = await requireUser();
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
  ]);
  const inviteLink = referralUrl(referralCode);
  // A project appears in exactly one list: available (not a member) or yours.
  const available = publicProjects.filter((p) => !memberships.has(p.id));
  const mine = publicProjects.filter((p) => memberships.has(p.id));
  // Owner assignments to projects that are not public still belong to "Your projects".
  const publicIds = new Set(publicProjects.map((p) => p.id));
  const privateAssigned = assigned.filter((a) => !publicIds.has(a.project_id));
  const roleLabel = user.isOwner ? 'Owner' : user.isAdmin ? 'Administrator' : 'Member';

  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-3xl tracking-tight">Your account</h1>

        <Card className="mt-6 bg-white dark:bg-paper/5">
          <AvatarEditor userId={user.userId} name={user.displayName} version={avatar} />
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-ink/60 dark:text-paper/60">Name</dt>
            <dd>{user.displayName}</dd>
            <dt className="text-ink/60 dark:text-paper/60">Email</dt>
            <dd className="break-all">{user.email}</dd>
            <dt className="text-ink/60 dark:text-paper/60">Role</dt>
            <dd>{roleLabel}</dd>
            <dt className="text-ink/60 dark:text-paper/60">Member since</dt>
            <dd>{memberSince ? dateOnly.format(memberSince) : '—'}</dd>
            <dt className="text-ink/60 dark:text-paper/60">NPS</dt>
            <dd>
              <a
                href="#invite"
                className="font-semibold underline decoration-quake/50 underline-offset-2"
              >
                {nps}
              </a>{' '}
              <span className="text-ink/60 dark:text-paper/60">
                {nps === 1 ? 'person' : 'people'} joined through your invitations
              </span>
            </dd>
          </dl>
        </Card>

        <section id="invite" className="mt-10 scroll-mt-24">
          <h2 className="font-display text-xl tracking-tight">Invite friends</h2>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
            Share your personal link or QR code, or send an invitation by email. Every person who
            creates and activates an account through it adds one point to your NPS.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-5 rounded-lg border border-ink/10 bg-white p-5 dark:border-paper/10 dark:bg-paper/5">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-5xl tabular-nums">{nps}</span>
                <span className="text-sm text-ink/70 dark:text-paper/70">
                  NPS{' '}
                  <span className="text-xs text-ink/50 dark:text-paper/50">
                    (Net Promoter Score: +1 for every person who joined)
                  </span>
                </span>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-ink/80 dark:text-paper/80">
                  Your invitation link
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={inviteLink}
                    aria-label="Your invitation link"
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
                alt="QR code of your invitation link"
                className="rounded-md bg-white p-1"
              />
              <figcaption className="mt-2 text-center text-xs text-ink/60 dark:text-paper/60">
                Scan to open your invitation
                <br />
                <a
                  href={`/r/${referralCode}/qr`}
                  download={`devquake-invite-${referralCode}.png`}
                  className="underline decoration-quake/50 underline-offset-2"
                >
                  Download QR code
                </a>
              </figcaption>
            </figure>
          </div>
        </section>

        <section id="invitations" className="mt-10 scroll-mt-24">
          <h2 className="font-display text-xl tracking-tight">Your invitations</h2>
          {invites.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">
              No invitations yet. Send one above or share your link.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-lg border border-ink/10 bg-white dark:border-paper/10 dark:bg-paper/5">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-ink/10 text-xs text-ink/60 dark:border-paper/10 dark:text-paper/60">
                  <tr>
                    <th className="px-4 py-2 font-medium">Invited</th>
                    <th className="px-4 py-2 font-medium">Sent</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5 dark:divide-paper/10">
                  {invites.map((i) => (
                    <tr key={i.id}>
                      <td className="px-4 py-2.5 break-all">
                        {i.email ?? (i.via_link ? 'Someone who used your link' : 'Deleted account')}
                      </td>
                      <td className="px-4 py-2.5 text-xs whitespace-nowrap text-ink/60 dark:text-paper/60">
                        {dateOnly.format(i.created_at)}
                      </td>
                      <td className="px-4 py-2.5">
                        <InviteStatus invite={i} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section id="available-projects" className="mt-10 scroll-mt-24">
          <h2 className="font-display text-xl tracking-tight">Available projects</h2>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
            Subscribe to a project to use its app. Apps that are not live yet open for you as soon
            as they go online.
          </p>
          {available.length === 0 ? (
            <p className="mt-3 text-sm text-ink/60 dark:text-paper/60">
              You are subscribed to everything that is available right now.
            </p>
          ) : (
            <div className="mt-3 grid items-start gap-3 sm:grid-cols-2">
              {available.map((p) => (
                <ProjectCard
                  key={p.id}
                  id={`project-${p.id}`}
                  project={p}
                  footer={<ProjectActions project={p} user={user} membership={undefined} />}
                  feedback={<ProjectFeedback project={p} user={user} mine={feedback.get(p.id)} />}
                />
              ))}
            </div>
          )}
        </section>

        <section id="your-projects" className="mt-10 scroll-mt-24">
          <h2 className="font-display text-xl tracking-tight">Your projects</h2>
          {mine.length === 0 && privateAssigned.length === 0 ? (
            <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">
              No projects yet. Subscribe to one above.
            </p>
          ) : (
            <div className="mt-3 grid items-start gap-3 sm:grid-cols-2">
              {mine.map((p) => (
                <ProjectCard
                  key={p.id}
                  id={`project-${p.id}`}
                  project={p}
                  footer={
                    <ProjectActions project={p} user={user} membership={memberships.get(p.id)} />
                  }
                  feedback={<ProjectFeedback project={p} user={user} mine={feedback.get(p.id)} />}
                />
              ))}
              {privateAssigned.map((p) => (
                <Card key={p.project_id} className="bg-white dark:bg-paper/5">
                  <p className="font-semibold">{p.name}</p>
                  <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">
                    Assigned to you by the owner · your role: {p.project_role}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section id="account-activity" className="mt-10 scroll-mt-24">
          <h2 className="font-display text-xl tracking-tight">Recent account activity</h2>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
            The last {events.length === 10 ? 10 : 'few'} things that happened on your account.
          </p>
          {events.length === 0 ? (
            <p className="mt-3 text-sm text-ink/60 dark:text-paper/60">Nothing yet.</p>
          ) : (
            <ol className="mt-3 divide-y divide-ink/10 rounded-lg border border-ink/10 bg-white text-sm dark:divide-paper/10 dark:border-paper/10 dark:bg-paper/5">
              {events.map((e) => {
                const d = describeEvent(e);
                return (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5"
                  >
                    <span className={d.warn ? 'font-medium text-red-700 dark:text-red-400' : ''}>
                      {d.text}
                    </span>
                    <span className="text-xs text-ink/60 tabular-nums dark:text-paper/60">
                      {dateTime.format(e.occurred_at)} UTC
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <h2 className="mt-10 font-display text-xl tracking-tight">Recent sign-in activity</h2>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
          Something you do not recognise? Contact{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className={emailLinkClass}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <ul className="mt-3 divide-y divide-ink/10 rounded-lg border border-ink/10 bg-white text-sm dark:divide-paper/10 dark:border-paper/10 dark:bg-paper/5">
          {signIns.map((s) => (
            <li key={s.id} className="flex flex-wrap justify-between gap-2 px-4 py-2.5">
              <span className="tabular-nums">{dateTime.format(s.occurred_at)} UTC</span>
              <span className="text-ink/70 dark:text-paper/70">
                {[s.city, s.country].filter(Boolean).join(', ') || 'Unknown location'}
                {s.is_proxy ? ' · VPN/proxy' : ''} · {s.browser ?? 'Unknown browser'}
                {s.outcome !== 'ok' && s.outcome !== 'code_sent' && (
                  <strong className="ml-1 text-red-700 dark:text-red-400">(failed)</strong>
                )}
              </span>
            </li>
          ))}
        </ul>

        <section
          id="delete-account"
          className="mt-14 rounded-lg border border-red-300 bg-red-50/60 p-5 dark:border-red-900 dark:bg-red-950/30"
        >
          <h2 className="font-display text-xl tracking-tight text-red-800 dark:text-red-300">
            Delete account
          </h2>
          <p className="mt-1 mb-4 text-sm text-ink/80 dark:text-paper/80">
            Permanently delete your account and all personal data we hold about you. This cannot be
            undone.
          </p>
          <DeleteAccount />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

import { Card } from '@devquake/ui';
import { ProjectActions } from '@/components/landing/project-actions';
import { ProjectCard } from '@/components/landing/project-card';
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
import { listPublicProjects } from '@/lib/public-projects';
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
    case 'user.updated':
      return { text: `An administrator updated your account: ${m}` };
    default:
      return { text: e.action };
  }
}

export default async function AccountPage() {
  const user = await requireUser();
  const [assigned, signIns, publicProjects, memberships, memberSince, events] = await Promise.all([
    getUserProjects(user.userId),
    listSnapshots({ userId: user.userId, limit: 10 }),
    listPublicProjects(),
    getMemberships(user.userId),
    getMemberSince(user.userId),
    listAccountEvents(user.userId, 10),
  ]);
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
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-ink/60 dark:text-paper/60">Name</dt>
            <dd>{user.displayName}</dd>
            <dt className="text-ink/60 dark:text-paper/60">Email</dt>
            <dd className="break-all">{user.email}</dd>
            <dt className="text-ink/60 dark:text-paper/60">Role</dt>
            <dd>{roleLabel}</dd>
            <dt className="text-ink/60 dark:text-paper/60">Member since</dt>
            <dd>{memberSince ? dateOnly.format(memberSince) : '—'}</dd>
          </dl>
        </Card>

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
                  project={p}
                  footer={
                    <ProjectActions
                      project={p}
                      user={user}
                      membership={undefined}
                      back="/account"
                    />
                  }
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
                  project={p}
                  footer={
                    <ProjectActions
                      project={p}
                      user={user}
                      membership={memberships.get(p.id)}
                      back="/account"
                    />
                  }
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
      </main>
      <SiteFooter />
    </div>
  );
}

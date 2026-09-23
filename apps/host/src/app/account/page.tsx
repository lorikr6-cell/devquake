import { Card } from '@devquake/ui';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { requireUser } from '@/lib/auth/admin';
import { CONTACT_EMAIL } from '@/lib/mail/templates';
import { pluginUrl } from '@/lib/domain';
import { getUserProjects, listSnapshots } from '@/lib/admin/users';

export const metadata = { title: 'Your account', robots: { index: false } };

const dateTime = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

export default async function AccountPage() {
  const user = await requireUser();
  const [projects, signIns] = await Promise.all([
    getUserProjects(user.userId),
    listSnapshots({ userId: user.userId, limit: 10 }),
  ]);
  const roleLabel = user.isOwner ? 'Owner' : user.isAdmin ? 'Administrator' : 'Member';

  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-3xl tracking-tight">Your account</h1>

        <Card className="mt-6 bg-white dark:bg-paper/5">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-ink/60 dark:text-paper/60">Name</dt>
            <dd>{user.displayName}</dd>
            <dt className="text-ink/60 dark:text-paper/60">Email</dt>
            <dd className="break-all">{user.email}</dd>
            <dt className="text-ink/60 dark:text-paper/60">Role</dt>
            <dd>{roleLabel}</dd>
          </dl>
        </Card>

        <h2 className="mt-10 font-display text-xl tracking-tight">Your projects</h2>
        {projects.length === 0 ? (
          <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">
            You are not assigned to any project yet. We will email you when that changes.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {projects.map((p) => (
              <li key={p.project_id}>
                <Card className="h-full bg-white dark:bg-paper/5">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-ink/60 dark:text-paper/60">
                    Your role: {p.project_role}
                  </p>
                  {p.plugin_id && (
                    <a
                      href={pluginUrl(p.plugin_id)}
                      className="mt-2 inline-block text-sm underline decoration-quake/50 underline-offset-2 hover:decoration-quake"
                    >
                      Open {pluginUrl(p.plugin_id).replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-10 font-display text-xl tracking-tight">Recent sign-in activity</h2>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
          Something you do not recognise? Contact{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline decoration-quake underline-offset-2"
          >
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

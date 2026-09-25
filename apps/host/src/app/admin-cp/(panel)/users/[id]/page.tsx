import { DateTime } from '@/components/date-time';
import { RemoveUserPanel } from '../../../_components/remove-users';
import { RetentionNote } from '@/components/retention-note';
import { RETENTION_DAYS } from '@/lib/retention';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@devquake/ui';
import { ADMIN_BASE, requireOwner } from '@/lib/auth/admin';
import { ROLE_ADMIN, ROLE_OWNER } from '@/lib/auth/session';
import { listProjects } from '@/lib/admin/ideas';
import {
  PROJECT_ROLES,
  getUser,
  getUserProjects,
  getUserRoleCodes,
  getUserSubscriptionIds,
  listRoles,
  listSnapshots,
} from '@/lib/admin/users';
import { SnapshotTable } from '../../../_components/snapshot-table';
import {
  PageHeader,
  Panel,
  inlineInputClass,
  inputClass,
  labelClass,
  linkClass,
} from '../../../_components/ui';
import { saveUserAction } from '../actions';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; mail?: string }>;
};

export async function generateMetadata({ params }: Props) {
  return { title: `User #${(await params).id}` };
}

const checkbox = 'size-4 rounded border-ink/30 accent-[var(--dq-quake)]';

export default async function UserPage({ params, searchParams }: Props) {
  const owner = await requireOwner();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const { saved, mail } = await searchParams;

  const [user, roleCodes, userProjects, roles, projects, snapshots, subscriptionIds] =
    await Promise.all([
      getUser(id),
      getUserRoleCodes(id),
      getUserProjects(id),
      listRoles(),
      listProjects(),
      listSnapshots({ userId: id, limit: 25 }),
      getUserSubscriptionIds(id),
    ]);
  if (!user) notFound();

  const isOwner = roleCodes.includes(ROLE_OWNER);
  const isSelf = id === owner.userId;
  const assigned = new Map(userProjects.map((p) => [p.project_id, p.project_role]));
  const otherRoles = roles.filter((r) => r.code !== ROLE_OWNER && r.code !== ROLE_ADMIN);
  const subscribed = new Set(subscriptionIds);
  // Public, non-archived projects can be subscribed to; current subscriptions stay listed so
  // they can be removed even if the project became private or archived.
  const subscribable = projects.filter(
    (p) => (p.is_public === 1 && p.status !== 'archived') || subscribed.has(p.id),
  );

  return (
    <>
      <PageHeader
        title={user.display_name}
        actions={
          <Link href={`${ADMIN_BASE}/users`} className={linkClass}>
            ← All users
          </Link>
        }
      />

      {saved && (
        <p
          role="status"
          className="mb-6 rounded-md border border-ink/10 bg-white px-4 py-3 text-sm dark:border-paper/10 dark:bg-paper/5"
        >
          {saved === 'none'
            ? 'Nothing changed.'
            : mail === 'sent'
              ? 'Changes saved. The user was emailed a summary and instructions.'
              : mail === 'failed'
                ? 'Changes saved, but the email could not be sent (check the SMTP settings).'
                : 'Changes saved (internal only, no email sent).'}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel>
          <form action={saveUserAction.bind(null, user.id)} className="space-y-6">
            <fieldset className="space-y-3">
              <legend className="mb-2 font-semibold">Access</legend>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="admin"
                  defaultChecked={isOwner || roleCodes.includes(ROLE_ADMIN)}
                  disabled={isOwner}
                  className={`${checkbox} mt-0.5`}
                />
                <span>
                  <span className="font-medium">Admin</span>
                  <span className="block text-xs text-ink/60 dark:text-paper/60">
                    May sign in to /admin-cp (dashboard, ideas, projects). Admins never see users,
                    statistics or the activity log.
                  </span>
                </span>
              </label>
              {isOwner && (
                <p className="text-xs text-ink/60 dark:text-paper/60">
                  This is the owner account; its access cannot be changed here.
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="status" className={labelClass}>
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={user.status}
                    disabled={isOwner || isSelf}
                    className={inputClass}
                  >
                    {user.status === 'pending' && (
                      <option value="pending">Pending (email not confirmed)</option>
                    )}
                    <option value="active">Active</option>
                    <option value="disabled">Disabled (signs out everywhere)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="rating" className={labelClass}>
                    Rating <span className="font-normal text-ink/60">(internal)</span>
                  </label>
                  <select
                    id="rating"
                    name="rating"
                    defaultValue={user.rating ?? ''}
                    className={inputClass}
                  >
                    <option value="">Not rated</option>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {'★'.repeat(n)} ({n})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {user.locked === 1 && (
                <label className="flex items-center gap-3 text-sm">
                  <input type="checkbox" name="unlock" className={checkbox} />
                  Unlock now (locked until <DateTime value={user.locked_until} />)
                </label>
              )}
            </fieldset>

            {otherRoles.length > 0 && (
              <fieldset>
                <legend className="mb-2 font-semibold">Roles</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {otherRoles.map((r) => (
                    <label key={r.code} className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        name="role"
                        value={r.code}
                        defaultChecked={roleCodes.includes(r.code)}
                        className={`${checkbox} mt-0.5`}
                      />
                      <span>
                        {r.name}
                        <span className="block text-xs text-ink/60 dark:text-paper/60">
                          {r.scope === 'platform' ? 'Platform' : `Plugin: ${r.scope}`}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <fieldset>
              <legend className="mb-2 font-semibold">Projects &amp; plugins</legend>
              <div className="divide-y divide-ink/5 rounded-md border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
                {projects.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
                    <label className="flex flex-1 items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        name="project"
                        value={p.id}
                        defaultChecked={assigned.has(p.id)}
                        className={checkbox}
                      />
                      {p.name}
                      {p.plugin_id && (
                        <span className="font-mono text-xs text-ink/50 dark:text-paper/50">
                          {p.plugin_id}
                        </span>
                      )}
                    </label>
                    <select
                      name={`project_role_${p.id}`}
                      defaultValue={assigned.get(p.id) ?? 'member'}
                      aria-label={`Role in ${p.name}`}
                      className={`${inlineInputClass} w-auto py-1`}
                    >
                      {PROJECT_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-1 font-semibold">Subscriptions</legend>
              <p className="mb-2 text-xs text-ink/60 dark:text-paper/60">
                The same subscriptions the user manages on their account page: a subscribed app
                opens for them once it is online. Assigned projects (above) give access too.
              </p>
              {subscribable.length === 0 ? (
                <p className="text-sm text-ink/60 dark:text-paper/60">No public projects yet.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {subscribable.map((p) => (
                    <label key={p.id} className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        name="subscription"
                        value={p.id}
                        defaultChecked={subscribed.has(p.id)}
                        className={`${checkbox} mt-0.5`}
                      />
                      <span>
                        {p.name}
                        <span className="block text-xs text-ink/60 dark:text-paper/60">
                          {p.is_online === 1 && p.is_public === 1 ? 'Online' : 'Not online yet'}
                          {(p.is_public !== 1 || p.status === 'archived') && ' · no longer public'}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4 dark:border-paper/10">
              <Button type="submit">Submit changes</Button>
              <p className="text-xs text-ink/60 dark:text-paper/60">
                Saves everything above at once and emails {user.email} a summary with instructions.
                Rating changes stay internal.
              </p>
            </div>
          </form>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <h2 className="mb-3 font-semibold">Account</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-ink/60 dark:text-paper/60">Email</dt>
              <dd className="break-all">{user.email}</dd>
              <dt className="text-ink/60 dark:text-paper/60">Confirmed</dt>
              <dd>
                <DateTime value={user.email_verified_at} />
              </dd>
              <dt className="text-ink/60 dark:text-paper/60">Created</dt>
              <dd>
                <DateTime value={user.created_at} />
              </dd>
              <dt className="text-ink/60 dark:text-paper/60">Last sign-in</dt>
              <dd>
                <DateTime value={user.last_login_at} />
                {user.last_login_ip && (
                  <span className="block font-mono text-xs">{user.last_login_ip}</span>
                )}
              </dd>
              <dt className="text-ink/60 dark:text-paper/60">Sessions</dt>
              <dd>{user.active_sessions} active</dd>
            </dl>
          </Panel>
        </div>
      </div>

      <h2 className="mt-10 font-display text-xl tracking-tight">Sign-in history</h2>
      <RetentionNote days={RETENTION_DAYS.authSnapshots} what="signinActivity" className="mb-3" />
      <SnapshotTable rows={snapshots} />

      {!isOwner && !isSelf ? (
        <RemoveUserPanel userId={user.id} email={user.email} name={user.display_name} />
      ) : null}
    </>
  );
}

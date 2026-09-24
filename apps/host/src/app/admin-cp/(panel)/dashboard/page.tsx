import Link from 'next/link';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { collectPluginStats } from '@/lib/plugin-platform';
import { countSecurityEvents, listActivity } from '@/lib/admin/activity-log';
import {
  IDEA_STATUSES,
  STATUS_LABELS,
  countIdeasByStatus,
  listActiveIdeas,
  listProjects,
} from '@/lib/admin/ideas';
import {
  PageHeader,
  Panel,
  PriorityLabel,
  ProgressBar,
  StatusBadge,
  formatDate,
  formatDateTime,
  linkClass,
} from '../../_components/ui';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const admin = await requireAdmin();
  // Activity and security numbers contain other users' data: owner only.
  const [counts, projects, active, recent, securityEvents, appStats] = await Promise.all([
    countIdeasByStatus(),
    listProjects(),
    listActiveIdeas(),
    admin.isOwner ? listActivity({}, 12) : null,
    admin.isOwner ? countSecurityEvents(24) : null,
    collectPluginStats().catch(() => []),
  ]);

  const total = IDEA_STATUSES.reduce((sum, s) => sum + counts[s], 0);
  const open = total - counts.done - counts.dropped;

  const tiles = [
    { label: 'Open ideas', value: open, href: `${ADMIN_BASE}/ideas` },
    {
      label: 'In progress',
      value: counts.in_progress,
      href: `${ADMIN_BASE}/ideas?status=in_progress`,
    },
    { label: 'Blocked', value: counts.blocked, href: `${ADMIN_BASE}/ideas?status=blocked` },
    { label: 'Done', value: counts.done, href: `${ADMIN_BASE}/ideas?status=done` },
    ...(securityEvents == null
      ? []
      : [
          {
            label: 'Security events (24 h)',
            value: securityEvents,
            href: `${ADMIN_BASE}/activity?level=security`,
          },
        ]),
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        actions={
          <Link href={`${ADMIN_BASE}/ideas/new`} className={linkClass}>
            + New idea
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href}>
            <Panel className="h-full p-4 transition-colors hover:border-quake">
              <p className="text-sm text-ink/70 dark:text-paper/70">{t.label}</p>
              <p className="mt-1 font-display text-4xl tabular-nums">{t.value}</p>
            </Panel>
          </Link>
        ))}
      </div>

      {appStats.length > 0 && (
        <Panel className="mt-6">
          <h2 className="mb-4 font-semibold">Apps</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {appStats.map((a) => (
              <div key={a.pluginId}>
                <p className="text-sm font-medium">
                  {a.name}{' '}
                  <span className="font-mono text-xs text-ink/50 dark:text-paper/50">
                    {a.pluginId}
                  </span>
                </p>
                {a.error ? (
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{a.error}</p>
                ) : (
                  <dl className="mt-2 grid grid-cols-2 gap-2">
                    {a.stats.map((s) => (
                      <div key={s.label}>
                        <dt className="text-xs text-ink/60 dark:text-paper/60">{s.label}</dt>
                        <dd className="font-display text-2xl tabular-nums">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-4 font-semibold">Projects</h2>
          <ul className="space-y-4">
            {projects.map((p) => (
              <li key={p.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <Link href={`${ADMIN_BASE}/ideas?project=${p.id}`} className={linkClass}>
                    {p.name}
                  </Link>
                  <span className="text-xs text-ink/60 dark:text-paper/60">
                    {Number(p.open_count ?? 0)} open · {p.idea_count} total
                  </span>
                </div>
                <ProgressBar value={Number(p.avg_progress ?? 0)} />
              </li>
            ))}
            {projects.length === 0 && (
              <li className="text-sm text-ink/60 dark:text-paper/60">No projects yet.</li>
            )}
          </ul>
        </Panel>

        <Panel>
          <h2 className="mb-4 font-semibold">Being worked on</h2>
          <ul className="divide-y divide-ink/5 dark:divide-paper/10">
            {active.map((idea) => (
              <li key={idea.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`${ADMIN_BASE}/ideas/${idea.id}`} className={`${linkClass} text-sm`}>
                    {idea.title}
                  </Link>
                  <StatusBadge status={idea.status} />
                  <PriorityLabel priority={idea.priority} />
                </div>
                <p className="mt-0.5 text-xs text-ink/60 dark:text-paper/60">
                  {idea.project_name ?? 'No project'}
                  {idea.target_date && ` · due ${formatDate(idea.target_date)}`}
                </p>
                <ProgressBar value={idea.progress} className="mt-2" />
              </li>
            ))}
            {active.length === 0 && (
              <li className="text-sm text-ink/60 dark:text-paper/60">
                Nothing is {STATUS_LABELS.in_progress.toLowerCase()} right now.
              </li>
            )}
          </ul>
        </Panel>
      </div>

      {recent && (
        <Panel className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent activity</h2>
            <Link href={`${ADMIN_BASE}/activity`} className={`${linkClass} text-sm`}>
              View all
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {recent.rows.map((a) => (
              <li key={a.id} className="flex flex-wrap gap-x-3">
                <span className="w-44 shrink-0 text-xs text-ink/60 dark:text-paper/60 tabular-nums">
                  {formatDateTime(a.occurred_at)}
                </span>
                <span className="font-mono text-xs">{a.source}</span>
                <span className="font-mono text-xs">{a.action}</span>
                <span className="text-ink/70 dark:text-paper/70">{a.message}</span>
              </li>
            ))}
            {recent.rows.length === 0 && (
              <li className="text-ink/60 dark:text-paper/60">No activity yet.</li>
            )}
          </ul>
        </Panel>
      )}
    </>
  );
}

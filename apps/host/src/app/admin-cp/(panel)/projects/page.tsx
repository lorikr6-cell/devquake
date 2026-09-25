import Link from 'next/link';
import { Button } from '@devquake/ui';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { ProjectAvatar } from '@/components/project-avatar';
import { PROJECT_KINDS, PROJECT_STATUSES, listProjects } from '@/lib/admin/ideas';
import { avatarChoices } from '@/lib/project-avatars';
import { trialCounts } from '@/lib/trials';
import {
  PageHeader,
  Panel,
  ProgressBar,
  VisibilityBadge,
  inlineInputClass,
  linkClass,
} from '../../_components/ui';

export const metadata = { title: 'Projects' };

type Props = {
  searchParams: Promise<{
    kind?: string;
    status?: string;
    visibility?: string;
    online?: string;
    q?: string;
  }>;
};

/** The projects grid with filters, like Ideas; "+ New project" opens the form page. */
export default async function ProjectsPage({ searchParams }: Props) {
  await requireAdmin();
  const { kind, status, visibility, online, q } = await searchParams;
  const [all, avatars, trials] = await Promise.all([
    listProjects(),
    avatarChoices(),
    trialCounts(),
  ]);
  const search = (q ?? '').trim().toLowerCase();
  const projects = all.filter(
    (p) =>
      (!kind || p.kind === kind) &&
      (!status || p.status === status) &&
      (!visibility || (visibility === 'public') === (p.is_public === 1)) &&
      (!online || (online === 'online') === (p.is_online === 1 && !!p.plugin_id)) &&
      (!search ||
        p.name.toLowerCase().includes(search) ||
        p.slug.toLowerCase().includes(search) ||
        (p.plugin_id ?? '').includes(search)),
  );
  const filtered = !!(kind || status || visibility || online || search);

  return (
    <>
      <PageHeader
        title="Projects"
        actions={
          <Link href={`${ADMIN_BASE}/projects/new`} className={linkClass}>
            + New project
          </Link>
        }
      />

      <form className="mb-4 flex flex-wrap items-end gap-3" action={`${ADMIN_BASE}/projects`}>
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Name, slug or subdomain"
          aria-label="Search projects"
          className={`${inlineInputClass} w-56`}
        />
        <select
          name="kind"
          defaultValue={kind ?? ''}
          aria-label="Kind"
          className={`${inlineInputClass} w-auto`}
        >
          <option value="">All kinds</option>
          {PROJECT_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ''}
          aria-label="Status"
          className={`${inlineInputClass} w-auto`}
        >
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          name="visibility"
          defaultValue={visibility ?? ''}
          aria-label="Visibility"
          className={`${inlineInputClass} w-auto`}
        >
          <option value="">Public and private</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <select
          name="online"
          defaultValue={online ?? ''}
          aria-label="Online"
          className={`${inlineInputClass} w-auto`}
        >
          <option value="">Online and offline</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
        {filtered ? (
          <Link href={`${ADMIN_BASE}/projects`} className={`${linkClass} self-center text-sm`}>
            Clear
          </Link>
        ) : null}
      </form>

      <Panel className="overflow-x-auto p-0">
        <table className="w-full min-w-190 text-sm">
          <thead className="border-b border-ink/10 text-left text-xs text-ink/60 dark:border-paper/10 dark:text-paper/60">
            <tr>
              <th className="px-4 py-2 font-medium">Project</th>
              <th className="px-4 py-2 font-medium">Kind</th>
              <th className="px-4 py-2 font-medium">Ideas</th>
              <th className="w-48 px-4 py-2 font-medium">Avg. progress</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium" title="NPS points to subscribe (0 = FREE)">
                NPS cost
              </th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5 dark:divide-paper/10">
            {projects.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3.5">
                    <Link href={`${ADMIN_BASE}/projects/${p.id}`} title="Edit project and logo">
                      <ProjectAvatar
                        project={{
                          name: p.name,
                          slug: p.slug,
                          pluginId: p.plugin_id,
                          description: p.description,
                          ...avatars.get(p.id),
                        }}
                        size={36}
                        className="mr-1 mb-1"
                      />
                    </Link>
                    <div>
                      <Link href={`${ADMIN_BASE}/ideas?project=${p.id}`} className={linkClass}>
                        {p.name}
                      </Link>
                      <p className="font-mono text-xs text-ink/60 dark:text-paper/60">
                        {p.slug} · {p.subscriber_count}{' '}
                        {Number(p.subscriber_count) === 1 ? 'subscriber' : 'subscribers'}
                        {trials.get(p.id)
                          ? ` · ${trials.get(p.id)} ${trials.get(p.id) === 1 ? 'trial' : 'trials'}`
                          : null}{' '}
                        · ♥ {Number(p.like_count)}
                        {p.rating_avg !== null ? ` · ★ ${Number(p.rating_avg).toFixed(1)}` : null}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink/70 dark:text-paper/70">{p.kind}</td>
                <td className="px-4 py-3 tabular-nums">
                  {Number(p.open_count ?? 0)} open / {p.idea_count}
                </td>
                <td className="px-4 py-3">
                  <ProgressBar value={Number(p.avg_progress ?? 0)} />
                </td>
                <td className="px-4 py-3 text-xs">
                  <VisibilityBadge isPublic={p.is_public === 1} /> {p.status}
                  {p.is_online === 1 && p.plugin_id ? (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-950 dark:bg-emerald-900/60 dark:text-emerald-100">
                      <span aria-hidden className="size-1.5 rounded-full bg-emerald-600" />
                      Online
                    </span>
                  ) : (
                    <span className="ml-2 text-ink/50 dark:text-paper/50">offline</span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {Number(p.nps_cost ?? 0) === 0 ? 'FREE' : Number(p.nps_cost)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`${ADMIN_BASE}/projects/${p.id}`} className={linkClass}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink/60 dark:text-paper/60">
                  {filtered ? 'No projects match these filters.' : 'No projects yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </>
  );
}

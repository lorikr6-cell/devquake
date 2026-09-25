import Link from 'next/link';
import { Button } from '@devquake/ui';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { ProjectAvatar } from '@/components/project-avatar';
import { PROJECT_KINDS, listProjects } from '@/lib/admin/ideas';
import { avatarChoices } from '@/lib/project-avatars';
import {
  PageHeader,
  Panel,
  ProgressBar,
  VisibilityBadge,
  inputClass,
  labelClass,
  linkClass,
} from '../../_components/ui';
import { createProjectAction } from './actions';

export const metadata = { title: 'Projects' };

const errors: Record<string, string> = {
  invalid: 'Name is required and the slug may only contain a-z, 0-9 and dashes.',
  duplicate: 'A project with this slug already exists.',
};

type Props = { searchParams: Promise<{ error?: string }> };

export default async function ProjectsPage({ searchParams }: Props) {
  await requireAdmin();
  const { error } = await searchParams;
  const [projects, avatars] = await Promise.all([listProjects(), avatarChoices()]);

  return (
    <>
      <PageHeader title="Projects" />

      <Panel className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-ink/10 text-left text-xs text-ink/60 dark:border-paper/10 dark:text-paper/60">
            <tr>
              <th className="px-4 py-2 font-medium">Project</th>
              <th className="px-4 py-2 font-medium">Kind</th>
              <th className="px-4 py-2 font-medium">Ideas</th>
              <th className="w-48 px-4 py-2 font-medium">Avg. progress</th>
              <th className="px-4 py-2 font-medium">Status</th>
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
                        {Number(p.subscriber_count) === 1 ? 'subscriber' : 'subscribers'} · ♥{' '}
                        {Number(p.like_count)}
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
                <td className="px-4 py-3 text-right">
                  <Link href={`${ADMIN_BASE}/projects/${p.id}`} className={linkClass}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel className="mt-6 max-w-3xl">
        <h2 className="mb-4 font-semibold">New project</h2>
        {error && errors[error] && (
          <p role="alert" className="mb-4 text-sm text-red-700 dark:text-red-400">
            {errors[error]}
          </p>
        )}
        <form action={createProjectAction} className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="name" className={labelClass}>
              Name
            </label>
            <input id="name" name="name" required maxLength={120} className={inputClass} />
          </div>
          <div>
            <label htmlFor="slug" className={labelClass}>
              Slug / plugin id
            </label>
            <input
              id="slug"
              name="slug"
              required
              pattern="[a-z0-9][a-z0-9\-]{0,62}"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="kind" className={labelClass}>
              Kind
            </label>
            <select id="kind" name="kind" defaultValue="plugin" className={inputClass}>
              {PROJECT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="description" className={labelClass}>
              Description
            </label>
            <textarea id="description" name="description" rows={2} className={inputClass} />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-3">
            <input type="checkbox" name="is_public" className="size-4 accent-[var(--dq-quake)]" />
            Public: show it on the landing page (you can change this later)
          </label>
          <div>
            <Button type="submit">Create project</Button>
          </div>
        </form>
      </Panel>
    </>
  );
}

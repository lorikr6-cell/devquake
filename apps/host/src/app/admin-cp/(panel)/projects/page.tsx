import Link from 'next/link';
import { Button } from '@devquake/ui';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { PROJECT_KINDS, PROJECT_STATUSES, listProjects } from '@/lib/admin/ideas';
import {
  PageHeader,
  Panel,
  ProgressBar,
  inputClass,
  labelClass,
  linkClass,
} from '../../_components/ui';
import { createProjectAction, setProjectStatusAction } from './actions';

export const metadata = { title: 'Projects' };

const errors: Record<string, string> = {
  invalid: 'Name is required and the slug may only contain a-z, 0-9 and dashes.',
  duplicate: 'A project with this slug already exists.',
};

type Props = { searchParams: Promise<{ error?: string }> };

export default async function ProjectsPage({ searchParams }: Props) {
  await requireAdmin();
  const { error } = await searchParams;
  const projects = await listProjects();

  return (
    <>
      <PageHeader title="Projects" />

      <Panel className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-2 font-medium">Project</th>
              <th className="px-4 py-2 font-medium">Kind</th>
              <th className="px-4 py-2 font-medium">Ideas</th>
              <th className="w-48 px-4 py-2 font-medium">Avg. progress</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {projects.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <Link href={`${ADMIN_BASE}/ideas?project=${p.id}`} className={linkClass}>
                    {p.name}
                  </Link>
                  <p className="font-mono text-xs text-zinc-500">{p.slug}</p>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{p.kind}</td>
                <td className="px-4 py-3 tabular-nums">
                  {Number(p.open_count ?? 0)} open / {p.idea_count}
                </td>
                <td className="px-4 py-3">
                  <ProgressBar value={Number(p.avg_progress ?? 0)} />
                </td>
                <td className="px-4 py-3">
                  <form action={setProjectStatusAction.bind(null, p.id)} className="flex gap-2">
                    <select
                      name="status"
                      defaultValue={p.status}
                      aria-label={`Status of ${p.name}`}
                      className={`${inputClass} w-auto py-1`}
                    >
                      {PROJECT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" variant="ghost" className="px-2 py-1">
                      Save
                    </Button>
                  </form>
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
          <div>
            <Button type="submit">Create project</Button>
          </div>
        </form>
      </Panel>
    </>
  );
}

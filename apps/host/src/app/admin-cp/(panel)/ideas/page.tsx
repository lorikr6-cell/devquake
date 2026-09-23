import Link from 'next/link';
import { Button } from '@devquake/ui';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { IDEA_STATUSES, STATUS_LABELS, listIdeas, listProjects } from '@/lib/admin/ideas';
import {
  PageHeader,
  Panel,
  PriorityLabel,
  ProgressBar,
  StatusBadge,
  formatDate,
  inlineInputClass,
  linkClass,
} from '../../_components/ui';

export const metadata = { title: 'Ideas' };

type Props = { searchParams: Promise<{ status?: string; project?: string }> };

export default async function IdeasPage({ searchParams }: Props) {
  await requireAdmin();
  const { status, project } = await searchParams;
  const projectId = Number(project) || undefined;
  const [ideas, projects] = await Promise.all([listIdeas({ status, projectId }), listProjects()]);

  return (
    <>
      <PageHeader
        title="Ideas"
        actions={
          <Link
            href={`${ADMIN_BASE}/ideas/new${projectId ? `?project=${projectId}` : ''}`}
            className={linkClass}
          >
            + New idea
          </Link>
        }
      />

      <form className="mb-4 flex flex-wrap items-end gap-3" action={`${ADMIN_BASE}/ideas`}>
        <select name="status" defaultValue={status ?? ''} className={`${inlineInputClass} w-auto`}>
          <option value="">All statuses</option>
          {IDEA_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          name="project"
          defaultValue={projectId ?? ''}
          className={`${inlineInputClass} w-auto`}
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      <Panel className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-ink/10 text-left text-xs text-ink/60 dark:border-paper/10 dark:text-paper/60">
            <tr>
              <th className="px-4 py-2 font-medium">Idea</th>
              <th className="px-4 py-2 font-medium">Project</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Priority</th>
              <th className="w-48 px-4 py-2 font-medium">Progress</th>
              <th className="px-4 py-2 font-medium">Target</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5 dark:divide-paper/10">
            {ideas.map((idea) => (
              <tr key={idea.id}>
                <td className="px-4 py-3">
                  <Link href={`${ADMIN_BASE}/ideas/${idea.id}`} className={linkClass}>
                    {idea.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink/70 dark:text-paper/70">
                  {idea.project_name ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={idea.status} />
                </td>
                <td className="px-4 py-3">
                  <PriorityLabel priority={idea.priority} />
                </td>
                <td className="px-4 py-3">
                  <ProgressBar value={idea.progress} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-ink/70 dark:text-paper/70">
                  {formatDate(idea.target_date)}
                </td>
              </tr>
            ))}
            {ideas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink/60 dark:text-paper/60">
                  No ideas match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </>
  );
}

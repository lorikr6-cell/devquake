import { notFound } from 'next/navigation';
import { Button } from '@devquake/ui';
import { requireAdmin } from '@/lib/auth/admin';
import {
  STATUS_LABELS,
  getIdea,
  listIdeaUpdates,
  listProjects,
  type IdeaStatus,
} from '@/lib/admin/ideas';
import {
  PageHeader,
  Panel,
  ProgressBar,
  StatusBadge,
  formatDateTime,
} from '../../../_components/ui';
import { deleteIdeaAction, updateIdeaAction } from '../actions';
import { IdeaForm } from '../idea-form';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  return { title: `Idea #${(await params).id}` };
}

const statusLabel = (s: string) => STATUS_LABELS[s as IdeaStatus] ?? s;

export default async function IdeaPage({ params }: Props) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [idea, updates, projects] = await Promise.all([
    getIdea(id),
    listIdeaUpdates(id),
    listProjects(),
  ]);
  if (!idea) notFound();

  return (
    <>
      <PageHeader title={idea.title} actions={<StatusBadge status={idea.status} />} />
      <ProgressBar value={idea.progress} className="mb-6 max-w-md" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel>
          <IdeaForm
            action={updateIdeaAction.bind(null, idea.id)}
            projects={projects}
            idea={idea}
            submitLabel="Save changes"
          />
        </Panel>

        <div className="space-y-6">
          <Panel>
            <h2 className="mb-4 font-semibold">Timeline</h2>
            <ol className="space-y-4 text-sm">
              {updates.map((u) => (
                <li key={u.id} className="border-l-2 border-zinc-200 pl-3 dark:border-zinc-700">
                  <p className="text-xs text-zinc-500">
                    {formatDateTime(u.created_at)}
                    {u.author_name && ` · ${u.author_name}`}
                  </p>
                  {u.new_status && (
                    <p>
                      Status: {u.old_status ? `${statusLabel(u.old_status)} → ` : ''}
                      {statusLabel(u.new_status)}
                    </p>
                  )}
                  {u.new_progress != null && (
                    <p>
                      Progress: {u.old_progress != null ? `${u.old_progress}% → ` : ''}
                      {u.new_progress}%
                    </p>
                  )}
                  {u.note && <p className="whitespace-pre-wrap">{u.note}</p>}
                </li>
              ))}
              {updates.length === 0 && <li className="text-zinc-500">No updates yet.</li>}
            </ol>
          </Panel>

          <Panel>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-zinc-500">Created</dt>
              <dd>{formatDateTime(idea.created_at)}</dd>
              <dt className="text-zinc-500">Started</dt>
              <dd>{formatDateTime(idea.started_at)}</dd>
              <dt className="text-zinc-500">Completed</dt>
              <dd>{formatDateTime(idea.completed_at)}</dd>
              <dt className="text-zinc-500">Last update</dt>
              <dd>{formatDateTime(idea.updated_at)}</dd>
            </dl>
          </Panel>

          <Panel>
            <h2 className="mb-2 font-semibold">Delete idea</h2>
            <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
              Removes the idea and its timeline. To keep the history, set the status to “Dropped”
              instead.
            </p>
            <form action={deleteIdeaAction.bind(null, idea.id)} className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="confirm" value="yes" required />I understand this
                cannot be undone
              </label>
              <Button type="submit" variant="secondary">
                Delete
              </Button>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}

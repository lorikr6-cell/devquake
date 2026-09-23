import { Button } from '@devquake/ui';
import {
  IDEA_PRIORITIES,
  IDEA_STATUSES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type IdeaRow,
  type ProjectRow,
} from '@/lib/admin/ideas';
import { inputClass, labelClass, toDateInput } from '../../_components/ui';

interface Props {
  action: (form: FormData) => Promise<void>;
  projects: ProjectRow[];
  idea?: IdeaRow;
  defaultProjectId?: number;
  submitLabel: string;
}

export function IdeaForm({ action, projects, idea, defaultProjectId, submitLabel }: Props) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={idea?.title}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="summary" className={labelClass}>
          Description
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={5}
          defaultValue={idea?.summary ?? ''}
          className={inputClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="project_id" className={labelClass}>
            Project
          </label>
          <select
            id="project_id"
            name="project_id"
            defaultValue={idea?.project_id ?? defaultProjectId ?? ''}
            className={inputClass}
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="priority" className={labelClass}>
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue={idea?.priority ?? 'medium'}
            className={inputClass}
          >
            {IDEA_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={idea?.status ?? 'idea'}
            className={inputClass}
          >
            {IDEA_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="progress" className={labelClass}>
            Progress (%)
          </label>
          <input
            id="progress"
            name="progress"
            type="number"
            min={0}
            max={100}
            step={5}
            defaultValue={idea?.progress ?? 0}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="target_date" className={labelClass}>
            Target date
          </label>
          <input
            id="target_date"
            name="target_date"
            type="date"
            defaultValue={toDateInput(idea?.target_date)}
            className={inputClass}
          />
        </div>
      </div>
      <label className="flex items-start gap-3 rounded-md border border-ink/10 p-3 dark:border-paper/10">
        <input
          type="checkbox"
          name="is_public"
          defaultChecked={idea ? idea.is_public === 1 : false}
          className="mt-0.5 size-4 accent-[var(--dq-quake)]"
        />
        <span>
          <span className="font-medium">Public</span>
          <span className="block text-xs text-ink/60 dark:text-paper/60">
            Show this idea (title, status and progress) on the landing page, under its project. The
            project must be public too. Private ideas are only visible here. Descriptions and notes
            are never published.
          </span>
        </span>
      </label>
      <div>
        <label htmlFor="note" className={labelClass}>
          Progress note{' '}
          <span className="font-normal text-ink/60 dark:text-paper/60">
            (added to the timeline)
          </span>
        </label>
        <textarea id="note" name="note" rows={3} className={inputClass} />
      </div>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}

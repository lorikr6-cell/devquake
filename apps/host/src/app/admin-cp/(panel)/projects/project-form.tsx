import { Button } from '@devquake/ui';
import { PROJECT_KINDS } from '@/lib/admin/ideas';
import { inputClass, labelClass } from '../../_components/ui';

interface Props {
  action: (form: FormData) => Promise<void>;
  submitLabel: string;
}

/**
 * A new project (like the idea form). Everything else — subdomain, status, online, NPS cost and
 * logo — is set on the project's page after it is created.
 */
export function ProjectForm({ action, submitLabel }: Props) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
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
            placeholder="e.g. bills"
            aria-describedby="slug-hint"
            className={inputClass}
          />
          <p id="slug-hint" className="mt-1 text-xs text-ink/60 dark:text-paper/60">
            a-z, 0-9 and dashes. For a plugin it is also its subdomain (bills.devquake.com).
          </p>
        </div>
      </div>
      <div>
        <label htmlFor="kind" className={labelClass}>
          Kind
        </label>
        <select id="kind" name="kind" defaultValue="plugin" className={`${inputClass} sm:w-60`}>
          {PROJECT_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="description" className={labelClass}>
          Scope{' '}
          <span className="font-normal text-ink/60 dark:text-paper/60">
            (public once the project is public)
          </span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          className={inputClass}
        />
      </div>
      <label className="flex items-start gap-3 rounded-md border border-ink/10 p-3 dark:border-paper/10">
        <input
          type="checkbox"
          name="is_public"
          className="mt-0.5 size-4 accent-[var(--dq-quake)]"
        />
        <span>
          <span className="font-medium">Public</span>
          <span className="block text-xs text-ink/60 dark:text-paper/60">
            Show it on the landing page. You can change this later; new projects are private.
          </span>
        </span>
      </label>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}

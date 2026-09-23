import { cn } from '@devquake/ui';
import { STATUS_LABELS } from '@/lib/admin/ideas';
import type { PublicProject } from '@/lib/public-projects';

const PROJECT_STATUS: Record<PublicProject['status'], string> = {
  active: 'In development',
  paused: 'Paused',
  completed: 'Completed',
};

function Bar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-1.5 overflow-hidden rounded-full bg-ink/10 dark:bg-paper/15', className)}
    >
      <div className="h-full rounded-full bg-quake" style={{ width: `${pct}%` }} />
    </div>
  );
}

/**
 * Expandable project card (native <details>, works without JavaScript). The app can only be
 * opened when an admin has put it online; otherwise the card says so.
 */
export function ProjectCard({ project }: { project: PublicProject }) {
  const online = !!project.url;
  return (
    <details className="group rounded-lg border border-ink/10 bg-white transition-colors open:border-ink/25 hover:border-ink/25 dark:border-paper/10 dark:bg-paper/5 dark:open:border-paper/25 dark:hover:border-paper/25">
      <summary className="flex cursor-pointer list-none flex-col gap-3 p-5 focus-visible:outline-2 focus-visible:outline-quake [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{project.name}</h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-ink/60 dark:text-paper/60">
              <span>{PROJECT_STATUS[project.status]}</span>
              <span aria-hidden>·</span>
              {online ? (
                <span className="inline-flex items-center gap-1 font-medium text-emerald-800 dark:text-emerald-300">
                  <span aria-hidden className="size-1.5 rounded-full bg-emerald-600" />
                  Online
                </span>
              ) : (
                <span>Not online yet</span>
              )}
            </p>
          </div>
          <span
            aria-hidden
            className="mt-1 text-ink/40 transition-transform group-open:rotate-180 dark:text-paper/40"
          >
            ▾
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Bar value={project.progress} className="flex-1" />
          <span className="w-10 text-right text-xs text-ink/70 tabular-nums dark:text-paper/70">
            {project.progress}%
          </span>
        </div>
        <span className="sr-only">Show details</span>
      </summary>

      <div className="border-t border-ink/10 px-5 pt-4 pb-5 text-sm dark:border-paper/10">
        {project.description && (
          <p className="text-ink/80 dark:text-paper/80">{project.description}</p>
        )}

        {project.ideas.length > 0 ? (
          <>
            <p className="mt-4 text-xs font-medium tracking-wider text-ink/60 uppercase dark:text-paper/60">
              Progress · {project.ideasDone} of {project.ideasTotal} done
            </p>
            <ul className="mt-2 space-y-2">
              {project.ideas.map((idea) => (
                <li
                  key={idea.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3"
                >
                  <span className={cn(idea.status === 'done' && 'text-ink/60 dark:text-paper/60')}>
                    {idea.title}
                  </span>
                  <span className="text-xs text-ink/60 dark:text-paper/60">
                    {STATUS_LABELS[idea.status]} · {idea.progress}%
                  </span>
                  <Bar value={idea.progress} className="col-span-2 mt-1" />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-3 text-ink/60 dark:text-paper/60">No milestones planned yet.</p>
        )}

        <div className="mt-5">
          {online ? (
            <a
              href={project.url!}
              className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 font-medium text-paper hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none dark:bg-paper dark:text-ink dark:hover:bg-paper/85"
            >
              Open {project.name}
              <span aria-hidden>→</span>
            </a>
          ) : (
            <p className="rounded-md bg-ink/5 px-3 py-2 text-xs text-ink/70 dark:bg-paper/10 dark:text-paper/70">
              This app is not open yet. It becomes available here once it is ready and switched on.
            </p>
          )}
        </div>
      </div>
    </details>
  );
}

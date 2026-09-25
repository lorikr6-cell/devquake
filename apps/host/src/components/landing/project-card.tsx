import type { ReactNode } from 'react';
import { cn, ReleaseNotes, type Translate } from '@devquake/ui';
import { getT } from '@/i18n/server';
import { ProjectAvatar } from '@/components/project-avatar';
import type { PublicProject } from '@/lib/public-projects';
import { FeedbackSummary } from './project-feedback';

function Bar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const done = pct === 100;
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'h-1.5 rounded-full',
        // A finished project: a glowing neon-blue bar that fades in and out (globals.css).
        done ? 'bg-sky-950/15 dark:bg-sky-300/10' : 'overflow-hidden bg-ink/10 dark:bg-paper/15',
        className,
      )}
    >
      <div
        className={cn('h-full rounded-full', done ? 'dq-neon-bar' : 'bg-quake')}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Shown instead of "100%": the project is finished and ready to use. */
function CompleteBadge({ label }: { label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[0_0_10px_rgba(56,189,248,0.6)] ring-2 ring-white dark:ring-ink"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}

/**
 * Expandable project card (native <details>, works without JavaScript). The app can only be
 * opened when an admin has put it online; otherwise the card says so.
 */
export async function ProjectCard({
  project,
  footer,
  feedback,
  membership,
  id,
  manage,
}: {
  project: PublicProject;
  /** Replaces the default footer (Open button / "not open yet") with state-specific actions. */
  footer?: ReactNode;
  /** Like button and ratings, shown under the footer. */
  feedback?: ReactNode;
  /** The visitor's access: shown as a badge on the card. */
  membership?: 'subscribed' | 'assigned';
  id?: string;
  /** Extra tools for people who manage the project (e.g. the logo editor), at the bottom. */
  manage?: ReactNode;
}) {
  const [t, tf] = await Promise.all([getT('landing.projects'), getT('landing.feedback')]);
  const online = !!project.url;
  const complete = Math.round(project.progress) >= 100;
  return (
    <details
      id={id}
      className={cn(
        'group scroll-mt-24 rounded-lg border transition-colors',
        complete
          ? // Finished: a cooler, higher-contrast surface with a bevelled (chiselled) edge.
            'border-sky-500/40 bg-gradient-to-b from-sky-50 to-white shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-2px_0_rgba(2,132,199,0.18),0_2px_8px_rgba(2,132,199,0.14)] open:border-sky-500/70 hover:border-sky-500/70 dark:border-sky-400/40 dark:from-sky-950/60 dark:to-ink dark:shadow-[inset_0_1px_0_rgba(125,211,252,0.18),inset_0_-2px_0_rgba(0,0,0,0.5),0_2px_10px_rgba(14,165,233,0.18)]'
          : 'border-ink/10 bg-white open:border-ink/25 hover:border-ink/25 dark:border-paper/10 dark:bg-paper/5 dark:open:border-paper/25 dark:hover:border-paper/25',
      )}
    >
      <summary className="flex cursor-pointer list-none flex-col gap-3 p-5 focus-visible:outline-2 focus-visible:outline-quake [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3.5">
            <ProjectAvatar
              project={{ ...project, ...project.avatar }}
              size={44}
              className="mt-0.5 mr-1 mb-1"
            />
            <div className="min-w-0">
              <h3 className="font-semibold">{project.name}</h3>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-ink/60 dark:text-paper/60">
                <span>{t(`status.${project.status}`)}</span>
                <span aria-hidden>·</span>
                {online ? (
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-800 dark:text-emerald-300">
                    <span aria-hidden className="size-1.5 rounded-full bg-emerald-600" />
                    {t('online')}
                  </span>
                ) : (
                  <span>{t('notOnline')}</span>
                )}
                {project.pluginId || project.npsCost > 0 ? (
                  <>
                    <span aria-hidden>·</span>
                    <span
                      title={t('costTitle')}
                      className="rounded bg-quake/10 px-1.5 py-0.5 font-semibold text-ink dark:text-paper"
                    >
                      {project.npsCost === 0 ? t('free') : t('cost', { count: project.npsCost })}
                    </span>
                  </>
                ) : null}
                <span aria-hidden>·</span>
                <FeedbackSummary feedback={project.feedback} t={tf} />
                {project.changelog[0] ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>v{project.changelog[0].version}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {membership ? (
              <span
                title={membership === 'subscribed' ? t('subscribedTitle') : t('assignedTitle')}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3.5 8.5l3 3 6-7" />
                </svg>
                {membership === 'subscribed' ? t('subscribed') : t('assigned')}
              </span>
            ) : null}
            <span
              aria-hidden
              className="mt-1 text-ink/40 transition-transform group-open:rotate-180 dark:text-paper/40"
            >
              ▾
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Bar value={project.progress} className="flex-1" />
          {complete ? (
            <CompleteBadge label={t('complete')} />
          ) : (
            <span className="w-10 text-right text-xs text-ink/70 tabular-nums dark:text-paper/70">
              {project.progress}%
            </span>
          )}
        </div>
        <span className="sr-only">{t('showDetails')}</span>
      </summary>

      <div className="border-t border-ink/10 px-5 pt-4 pb-5 text-sm dark:border-paper/10">
        {project.description && (
          <p className="whitespace-pre-line text-ink/80 dark:text-paper/80">
            {project.description}
          </p>
        )}

        {project.ideas.length > 0 ? (
          <>
            <p className="mt-4 text-xs font-medium tracking-wider text-ink/60 uppercase dark:text-paper/60">
              {t('progress', { done: project.ideasDone, total: project.ideasTotal })}
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
                    {t(`ideaStatus.${idea.status}`)} · {idea.progress}%
                  </span>
                  <Bar value={idea.progress} className="col-span-2 mt-1" />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-3 text-ink/60 dark:text-paper/60">{t('noMilestones')}</p>
        )}

        {project.changelog[0] || project.publicPages.length ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {project.changelog[0] ? (
              <ReleaseNotes
                entries={project.changelog}
                title={project.name}
                label={t('whatsNew', { version: project.changelog[0].version })}
              />
            ) : null}
            {project.publicPages.map((page) => (
              <a
                key={page.url}
                href={page.url}
                className="text-xs font-medium underline decoration-quake/50 underline-offset-2 hover:decoration-quake"
              >
                {page.title}
              </a>
            ))}
          </div>
        ) : null}

        <div className="mt-5">{footer ?? <DefaultFooter project={project} t={t} />}</div>
        {feedback}
        {manage}
      </div>
    </details>
  );
}

function DefaultFooter({ project, t }: { project: PublicProject; t: Translate }) {
  return project.url ? (
    <a
      href={project.url}
      className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 font-medium text-paper hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none dark:bg-paper dark:text-ink dark:hover:bg-paper/85"
    >
      {t('open', { name: project.name })}
      <span aria-hidden>→</span>
    </a>
  ) : (
    <p className="rounded-md bg-ink/5 px-3 py-2 text-xs text-ink/70 dark:bg-paper/10 dark:text-paper/70">
      {t('notOpenYet')}
    </p>
  );
}

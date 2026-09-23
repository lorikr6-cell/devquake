import type { ReactNode } from 'react';
import { cn } from '@devquake/ui';
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  type IdeaPriority,
  type IdeaStatus,
} from '@/lib/admin/ideas';

export { inputClass, labelClass } from './form-styles';

/** Single-hue progress meter; the percentage is always printed next to it. */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
      >
        <div
          className="h-full rounded-full bg-sky-600 dark:bg-sky-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs text-zinc-600 tabular-nums dark:text-zinc-400">
        {pct}%
      </span>
    </div>
  );
}

// Status pills always carry their text label; color is only a secondary cue.
const statusStyles: Record<IdeaStatus, string> = {
  idea: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  planned: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200',
  in_progress: 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  blocked: 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  done: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  dropped: 'bg-zinc-100 text-zinc-500 line-through dark:bg-zinc-800 dark:text-zinc-500',
};

export function StatusBadge({ status }: { status: IdeaStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        statusStyles[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityLabel({ priority }: { priority: IdeaPriority }) {
  return (
    <span
      className={cn(
        'text-xs whitespace-nowrap',
        priority === 'critical' || priority === 'high'
          ? 'font-semibold text-zinc-900 dark:text-zinc-100'
          : 'text-zinc-500',
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {actions}
    </div>
  );
}

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        'rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900',
        className,
      )}
      {...props}
    />
  );
}

const dateTime = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});
const dateOnly = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' });

export function formatDateTime(d: Date | null | undefined): string {
  return d ? `${dateTime.format(d)} UTC` : '—';
}

export function formatDate(d: Date | null | undefined): string {
  return d ? dateOnly.format(d) : '—';
}

/** Value for <input type="date"> from a DATE column. */
export function toDateInput(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 10) : '';
}

export const linkClass =
  'text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-900 ' +
  'dark:text-zinc-100 dark:decoration-zinc-600 dark:hover:decoration-zinc-100';

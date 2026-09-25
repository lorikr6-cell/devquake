import type { ReactNode } from 'react';
import { cn } from '@devquake/ui';
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  type IdeaPriority,
  type IdeaStatus,
} from '@/lib/admin/ideas';

export { inlineInputClass, inputClass, labelClass } from '@/components/form-styles';

/** Single-hue progress meter in Quake orange; the percentage is always printed next to it. */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10 dark:bg-paper/15"
      >
        <div className="h-full rounded-full bg-quake" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-xs text-ink/70 tabular-nums dark:text-paper/70">
        {pct}%
      </span>
    </div>
  );
}

// Status pills always carry their text label; colour is only a secondary cue. Text stays in
// Ink / Paper: Quake orange is too light for small text on light backgrounds (docs/brand.md).
const statusStyles: Record<IdeaStatus, string> = {
  idea: 'bg-ink/5 text-ink/80 dark:bg-paper/10 dark:text-paper/80',
  planned: 'bg-ink/10 text-ink dark:bg-paper/15 dark:text-paper',
  in_progress: 'bg-quake/15 text-ink dark:bg-quake/25 dark:text-paper',
  blocked: 'bg-amber-100 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100',
  done: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/60 dark:text-emerald-100',
  dropped: 'bg-ink/5 text-ink/50 line-through dark:bg-paper/5 dark:text-paper/50',
};

export function StatusBadge({ status }: { status: IdeaStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        statusStyles[status],
      )}
    >
      {status === 'in_progress' && <span aria-hidden className="size-1.5 rounded-full bg-quake" />}
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
          ? 'font-semibold text-ink dark:text-paper'
          : 'text-ink/60 dark:text-paper/60',
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-display text-3xl tracking-tight">{title}</h1>
      {actions}
    </div>
  );
}

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        'rounded-lg border border-ink/10 bg-white p-5 dark:border-paper/10 dark:bg-paper/5',
        className,
      )}
      {...props}
    />
  );
}

// Timestamps: use <DateTime> (viewer's time zone, ADR 0010). This formatter is only for DATE
// columns (calendar days without a time, e.g. an idea's target date): they are shown as stored,
// never shifted into a time zone.
const dateOnly = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' });

export function formatDate(d: Date | null | undefined): string {
  return d ? dateOnly.format(d) : '—';
}

/** Value for <input type="date"> from a DATE column. */
export function toDateInput(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 10) : '';
}

export const linkClass =
  'text-ink underline decoration-quake/40 underline-offset-2 hover:decoration-quake ' +
  'dark:text-paper';

/** Public (on the landing page) or private (admin only); always labelled, never colour alone. */
export function VisibilityBadge({ isPublic }: { isPublic: boolean }) {
  return isPublic ? (
    <span className="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-sky-950 dark:bg-sky-900/60 dark:text-sky-100">
      Public
    </span>
  ) : (
    <span className="inline-flex rounded-full border border-ink/20 px-2 py-0.5 text-xs whitespace-nowrap text-ink/70 dark:border-paper/25 dark:text-paper/70">
      Private
    </span>
  );
}

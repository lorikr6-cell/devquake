import Link from 'next/link';
import { Button, cn } from '@devquake/ui';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import {
  ACTIVITY_LEVELS,
  ACTIVITY_PAGE_SIZE,
  listActivity,
  listActivitySources,
  type ActivityFilter,
} from '@/lib/admin/activity-log';
import { PageHeader, Panel, formatDateTime, inputClass, linkClass } from '../../_components/ui';

export const metadata = { title: 'Activity log' };

type Props = {
  searchParams: Promise<{ source?: string; level?: string; action?: string; page?: string }>;
};

const levelStyles: Record<string, string> = {
  warning: 'text-amber-800 dark:text-amber-300',
  error: 'font-semibold text-red-700 dark:text-red-400',
  security: 'font-semibold text-violet-800 dark:text-violet-300',
};

export default async function ActivityPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const filter: ActivityFilter = {
    source: sp.source || undefined,
    level: sp.level || undefined,
    action: sp.action?.trim().slice(0, 100) || undefined,
    page: Math.max(1, Number(sp.page) || 1),
  };
  const [{ rows, total }, sources] = await Promise.all([
    listActivity(filter),
    listActivitySources(),
  ]);
  const page = filter.page ?? 1;
  const pages = Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE));

  const pageHref = (p: number) => {
    const qs = new URLSearchParams();
    if (filter.source) qs.set('source', filter.source);
    if (filter.level) qs.set('level', filter.level);
    if (filter.action) qs.set('action', filter.action);
    qs.set('page', String(p));
    return `${ADMIN_BASE}/activity?${qs}`;
  };

  return (
    <>
      <PageHeader title="Activity log" />

      <form className="mb-4 flex flex-wrap items-end gap-3" action={`${ADMIN_BASE}/activity`}>
        <select
          name="source"
          defaultValue={filter.source ?? ''}
          aria-label="Source"
          className={`${inputClass} w-auto`}
        >
          <option value="">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          name="level"
          defaultValue={filter.level ?? ''}
          aria-label="Level"
          className={`${inputClass} w-auto`}
        >
          <option value="">All levels</option>
          {ACTIVITY_LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <input
          name="action"
          defaultValue={filter.action ?? ''}
          placeholder="Action starts with… (e.g. auth.)"
          aria-label="Action prefix"
          className={`${inputClass} w-64`}
        />
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      <Panel className="overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-ink/10 text-left text-xs text-ink/60 dark:border-paper/10 dark:text-paper/60">
            <tr>
              <th className="px-4 py-2 font-medium">Time</th>
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 font-medium">Level</th>
              <th className="px-4 py-2 font-medium">Action</th>
              <th className="px-4 py-2 font-medium">Details</th>
              <th className="px-4 py-2 font-medium">User / IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5 dark:divide-paper/10">
            {rows.map((a) => (
              <tr key={a.id} className="align-top">
                <td className="px-4 py-2 text-xs whitespace-nowrap text-ink/60 dark:text-paper/60 tabular-nums">
                  {formatDateTime(a.occurred_at)}
                </td>
                <td className="px-4 py-2 font-mono text-xs">{a.source}</td>
                <td className={cn('px-4 py-2 text-xs', levelStyles[a.level])}>{a.level}</td>
                <td className="px-4 py-2 font-mono text-xs">{a.action}</td>
                <td className="px-4 py-2">
                  {a.message}
                  {a.entity_type === 'idea' && a.entity_id && (
                    <>
                      {' '}
                      <Link href={`${ADMIN_BASE}/ideas/${a.entity_id}`} className={linkClass}>
                        idea #{a.entity_id}
                      </Link>
                    </>
                  )}
                  {a.request_path && (
                    <p className="font-mono text-xs text-ink/60 dark:text-paper/60">
                      {a.request_path}
                    </p>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-ink/70 dark:text-paper/70">
                  {a.actor_name ?? '—'}
                  <br />
                  <span className="font-mono">{a.ip ?? ''}</span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink/60 dark:text-paper/60">
                  No entries match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>

      <div className="mt-4 flex items-center justify-between text-sm text-ink/70 dark:text-paper/70">
        <span>
          {total} entries · page {page} of {pages}
        </span>
        <span className="flex gap-4">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className={linkClass}>
              ← Newer
            </Link>
          )}
          {page < pages && (
            <Link href={pageHref(page + 1)} className={linkClass}>
              Older →
            </Link>
          )}
        </span>
      </div>
    </>
  );
}

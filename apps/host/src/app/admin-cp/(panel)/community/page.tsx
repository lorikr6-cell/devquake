import Link from 'next/link';
import { cn } from '@devquake/ui';
import { DateTime } from '@/components/date-time';
import { StatusBadge } from '@/components/ideas/idea-bits';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { addToRoadmapAction, hideIdeaAction, staffDeleteIdeaAction } from '@/lib/community-actions';
import {
  COMMUNITY_STATUSES,
  COMMUNITY_STATUS_LABELS,
  type CommunityStatus,
} from '@/lib/community-idea-rules';
import { listIdeasForStaff, viewerOf } from '@/lib/community-ideas';
import { PageHeader, Panel, linkClass } from '../../_components/ui';

export const metadata = { title: 'Community ideas' };

type Props = { searchParams: Promise<{ status?: string }> };

const action =
  'rounded border border-ink/20 px-2 py-1 text-xs hover:bg-ink/5 dark:border-paper/20 dark:hover:bg-paper/10';

/**
 * Community ideas for staff: the public ones (hidden included), most voted first. Review,
 * answers and comment moderation happen on the idea's own page (/ideas/<id>).
 */
export default async function CommunityIdeasPage({ searchParams }: Props) {
  const staff = await requireAdmin();
  const { status } = await searchParams;
  const filter = (COMMUNITY_STATUSES as readonly string[]).includes(status ?? '')
    ? (status as CommunityStatus)
    : undefined;
  const ideas = await listIdeasForStaff(viewerOf(staff)!, filter);

  const tab = (value: CommunityStatus | undefined, label: string) => (
    <Link
      key={value ?? 'all'}
      href={value ? `${ADMIN_BASE}/community?status=${value}` : `${ADMIN_BASE}/community`}
      aria-current={filter === value ? 'page' : undefined}
      className={cn(
        'border-b-2 px-3 py-1.5 text-sm',
        filter === value
          ? 'border-quake font-medium'
          : 'border-transparent text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper',
      )}
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHeader title="Community ideas" />
      <p className="mb-4 max-w-prose text-sm text-ink/70 dark:text-paper/70">
        Public ideas shared by members, most voted first. Open an idea to answer it, change its
        status or moderate comments; <strong>Add to roadmap</strong> copies it into Ideas (private
        until you publish it). Private ideas stay with their authors and are not listed.
      </p>
      <nav className="mb-4 flex flex-wrap gap-1 border-b border-ink/10 dark:border-paper/10">
        {tab(undefined, 'All')}
        {COMMUNITY_STATUSES.map((s) => tab(s, COMMUNITY_STATUS_LABELS[s]))}
      </nav>
      <Panel className="overflow-x-auto p-0">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-ink/10 text-left text-xs text-ink/60 dark:border-paper/10 dark:text-paper/60">
            <tr>
              <th className="px-4 py-2 font-medium">Idea</th>
              <th className="px-4 py-2 font-medium">Votes</th>
              <th className="px-4 py-2 font-medium">Comments</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Shared</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5 dark:divide-paper/10">
            {ideas.map((i) => (
              <tr key={i.id} className={i.hidden_at ? 'opacity-60' : undefined}>
                <td className="px-4 py-3">
                  <Link href={`/ideas/${i.id}`} className={linkClass}>
                    {i.title}
                  </Link>
                  <p className="text-xs text-ink/60 dark:text-paper/60">
                    {i.author_name} · {i.project_name ?? 'A new app'}
                    {i.image_v ? ' · picture' : ''}
                    {i.hidden_at ? ' · hidden' : ''}
                  </p>
                </td>
                <td className="px-4 py-3 tabular-nums">{Number(i.votes)}</td>
                <td className="px-4 py-3 tabular-nums">{Number(i.comments)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={i.status} />
                </td>
                <td className="px-4 py-3 text-xs">
                  <DateTime value={i.created_at} style="date" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {i.roadmap_idea_id ? (
                      <Link href={`${ADMIN_BASE}/ideas/${i.roadmap_idea_id}`} className={action}>
                        On roadmap
                      </Link>
                    ) : (
                      <form action={addToRoadmapAction.bind(null, i.id)}>
                        <button type="submit" className={action}>
                          Add to roadmap
                        </button>
                      </form>
                    )}
                    <form action={hideIdeaAction.bind(null, i.id, !i.hidden_at)}>
                      <button type="submit" className={action}>
                        {i.hidden_at ? 'Show' : 'Hide'}
                      </button>
                    </form>
                    <details>
                      <summary className={`${action} list-none text-red-700 dark:text-red-400`}>
                        Delete
                      </summary>
                      <form action={staffDeleteIdeaAction.bind(null, i.id)} className="mt-1">
                        <button
                          type="submit"
                          className={`${action} text-red-700 dark:text-red-400`}
                        >
                          Confirm delete
                        </button>
                      </form>
                    </details>
                  </div>
                </td>
              </tr>
            ))}
            {ideas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink/60 dark:text-paper/60">
                  No community ideas yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </>
  );
}

import { Link, cn } from '@devquake/ui';
import { getT } from '@/i18n/server';
import { DateTime } from '@/components/date-time';
import { canVote, type Viewer } from '@/lib/community-idea-rules';
import { facts, type CommunityIdea } from '@/lib/community-ideas';
import { voteAction } from '@/lib/community-actions';

export const ideaImageUrl = (idea: Pick<CommunityIdea, 'id' | 'image_v'>) =>
  idea.image_v ? `/ideas/${idea.id}/image?v=${idea.image_v}` : null;

const STATUS_STYLE: Record<CommunityIdea['status'], string> = {
  open: 'bg-ink/5 text-ink/70 dark:bg-paper/10 dark:text-paper/70',
  under_review: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  accepted: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  declined: 'bg-ink/10 text-ink/60 dark:bg-paper/10 dark:text-paper/60',
};

export async function StatusBadge({ status }: { status: CommunityIdea['status'] }) {
  const t = await getT('ideas.status');
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLE[status])}>
      {t(status)}
    </span>
  );
}

/** ▲ Vote · 12 (a form: works without JavaScript). Just the count when voting is not possible. */
export async function VoteButton({ idea, viewer }: { idea: CommunityIdea; viewer: Viewer }) {
  const t = await getT('ideas.card');
  const votes = Number(idea.votes);
  if (!canVote(facts(idea), viewer)) {
    return (
      <span className="text-sm text-ink/60 tabular-nums dark:text-paper/60">
        ▲ {t('votes', { count: votes })}
      </span>
    );
  }
  const voted = Number(idea.my_vote) === 1;
  return (
    <form action={voteAction.bind(null, idea.id)}>
      <button
        type="submit"
        aria-pressed={voted}
        title={voted ? t('unvoteTitle') : t('voteTitle')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium tabular-nums focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none',
          voted
            ? 'bg-quake text-white hover:bg-quake/90'
            : 'border border-ink/20 hover:border-quake hover:text-quake dark:border-paper/20',
        )}
      >
        <span aria-hidden>▲</span>
        {voted ? t('voted') : t('vote')} · {votes}
      </button>
    </form>
  );
}

export async function IdeaCard({ idea, viewer }: { idea: CommunityIdea; viewer: Viewer }) {
  const t = await getT('ideas.card');
  const image = ideaImageUrl(idea);
  const mine = idea.author_user_id === viewer.userId;
  return (
    <li className="flex gap-4 rounded-lg border border-ink/10 bg-white p-4 dark:border-paper/10 dark:bg-paper/5">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- access-checked route
        <img
          src={image}
          alt=""
          loading="lazy"
          className="size-20 shrink-0 rounded-md object-cover"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/ideas/${idea.id}`}
            className="font-semibold underline decoration-quake/0 underline-offset-2 hover:decoration-quake"
          >
            {idea.title}
          </Link>
          <StatusBadge status={idea.status} />
          {idea.is_public === 1 ? null : (
            <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs dark:bg-paper/10">
              {t('private')}
            </span>
          )}
          {idea.hidden_at ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800 dark:bg-red-950 dark:text-red-300">
              {t('hidden')}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">
          {mine ? t('yourIdea') : t('by', { name: idea.author_name ?? '' })} ·{' '}
          {idea.project_name ?? t('newApp')} · <DateTime value={idea.created_at} style="date" /> ·{' '}
          {t('comments', { count: Number(idea.comments) })}
        </p>
        {idea.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-ink/80 dark:text-paper/80">
            {idea.description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">
        <VoteButton idea={idea} viewer={viewer} />
      </div>
    </li>
  );
}

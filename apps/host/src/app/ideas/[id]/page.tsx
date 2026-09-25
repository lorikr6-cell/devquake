import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DateTime } from '@/components/date-time';
import { CommentForm } from '@/components/ideas/comment-form';
import { StatusBadge, VoteButton, ideaImageUrl } from '@/components/ideas/idea-bits';
import { IdeasShell, IdeasSignIn } from '@/components/ideas/ideas-shell';
import { VotingExplained } from '@/components/ideas/voting-explained';
import { inputClass, labelClass } from '@/components/form-styles';
import { ADMIN_BASE } from '@/lib/auth/admin';
import { getSessionUser } from '@/lib/auth/session';
import {
  addToRoadmapAction,
  deleteCommentAction,
  deleteIdeaAction,
  hideCommentAction,
  hideIdeaAction,
  reviewIdeaAction,
} from '@/lib/community-actions';
import {
  COMMUNITY_STATUSES,
  COMMUNITY_STATUS_LABELS,
  canComment,
} from '@/lib/community-idea-rules';
import { facts, getIdea, listComments, viewerOf } from '@/lib/community-ideas';

export const metadata = { title: 'Idea', robots: { index: false } };

const smallButton =
  'rounded-md border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5 dark:border-paper/20 dark:hover:bg-paper/10';
const dangerButton =
  'rounded-md border border-red-600 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950';

export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser().catch(() => null);
  if (!user) return <IdeasSignIn path={`/ideas/${id}`} />;
  const viewer = viewerOf(user)!;
  const idea = await getIdea(Number(id), viewer);
  if (!idea) notFound();
  const comments = await listComments(idea.id, viewer);
  const mine = idea.author_user_id === user.userId;
  const image = ideaImageUrl(idea);
  const f = facts(idea);

  return (
    <IdeasShell>
      <Link href="/ideas" className="text-sm text-ink/60 hover:text-quake dark:text-paper/60">
        ← All ideas
      </Link>

      <article className="mt-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight">{idea.title}</h1>
            <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">
              {mine ? 'Your idea' : `By ${idea.author_name}`} · {idea.project_name ?? 'A new app'} ·{' '}
              <DateTime value={idea.created_at} style="date" />
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={idea.status} />
              {f.isPublic ? null : (
                <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs dark:bg-paper/10">
                  Private: only you can see it
                </span>
              )}
              {f.hidden ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800 dark:bg-red-950 dark:text-red-300">
                  Hidden by moderation
                </span>
              ) : null}
            </div>
          </div>
          <VoteButton idea={idea} viewer={viewer} />
        </div>

        {image ? (
          <a href={image} className="mt-6 block">
            {/* eslint-disable-next-line @next/next/no-img-element -- access-checked route */}
            <img
              src={image}
              alt={`Picture for the idea “${idea.title}”`}
              className="max-h-[28rem] w-full rounded-lg border border-ink/10 bg-white object-contain dark:border-paper/10"
            />
          </a>
        ) : null}

        {idea.description ? (
          <p className="mt-6 text-base leading-relaxed whitespace-pre-wrap">{idea.description}</p>
        ) : null}

        {idea.staff_note ? (
          <div className="mt-6 rounded-lg border-l-4 border-quake bg-white p-4 text-sm dark:bg-paper/5">
            <p className="font-semibold">DevQuake’s answer</p>
            <p className="mt-1 whitespace-pre-wrap">{idea.staff_note}</p>
          </div>
        ) : null}

        {mine ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link href={`/ideas/${idea.id}/edit`} className={smallButton}>
              Edit
            </Link>
            <details>
              <summary className={`${dangerButton} list-none`}>Delete…</summary>
              <form action={deleteIdeaAction.bind(null, idea.id)} className="mt-2 text-sm">
                <p>Delete this idea with its picture, votes and comments?</p>
                <button type="submit" className={`${dangerButton} mt-2`}>
                  Yes, delete it
                </button>
              </form>
            </details>
          </div>
        ) : null}
      </article>

      {viewer.isAdmin && f.isPublic ? (
        <section className="mt-10 rounded-lg border border-ink/15 bg-white p-5 dark:border-paper/15 dark:bg-paper/5">
          <h2 className="font-semibold">Moderation and review (staff only)</h2>
          <form
            action={reviewIdeaAction.bind(null, idea.id)}
            className="mt-3 grid gap-3 sm:grid-cols-3"
          >
            <div>
              <label htmlFor="review-status" className={labelClass}>
                Status
              </label>
              <select
                id="review-status"
                name="status"
                defaultValue={idea.status}
                className={inputClass}
              >
                {COMMUNITY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {COMMUNITY_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="review-note" className={labelClass}>
                Public answer (optional)
              </label>
              <textarea
                id="review-note"
                name="staff_note"
                rows={2}
                maxLength={500}
                defaultValue={idea.staff_note ?? ''}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-3">
              <button type="submit" className={smallButton}>
                Save review
              </button>
            </div>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {idea.roadmap_idea_id ? (
              <Link href={`${ADMIN_BASE}/ideas/${idea.roadmap_idea_id}`} className={smallButton}>
                On the roadmap →
              </Link>
            ) : (
              <form action={addToRoadmapAction.bind(null, idea.id)}>
                <button type="submit" className={smallButton}>
                  Add to roadmap
                </button>
              </form>
            )}
            <form action={hideIdeaAction.bind(null, idea.id, !f.hidden)}>
              <button type="submit" className={smallButton}>
                {f.hidden ? 'Show again' : 'Hide from members'}
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-xl tracking-tight">
          Comments{' '}
          <span className="text-base text-ink/60 dark:text-paper/60">({comments.length})</span>
        </h2>
        {comments.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">No comments yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {comments.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-ink/10 bg-white p-4 text-sm dark:border-paper/10 dark:bg-paper/5"
              >
                <p className="text-xs text-ink/60 dark:text-paper/60">
                  <span className="font-medium text-ink dark:text-paper">
                    {c.user_id === user.userId ? 'You' : c.author_name}
                  </span>{' '}
                  · <DateTime value={c.created_at} />
                  {c.hidden_at ? (
                    <span className="ml-2 text-red-700 dark:text-red-400">
                      hidden by moderation
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
                <div className="mt-2 flex gap-3 text-xs">
                  {c.user_id === user.userId || viewer.isAdmin ? (
                    <form action={deleteCommentAction.bind(null, c.id)}>
                      <button type="submit" className="underline hover:text-quake">
                        Delete
                      </button>
                    </form>
                  ) : null}
                  {viewer.isAdmin ? (
                    <form action={hideCommentAction.bind(null, c.id, !c.hidden_at)}>
                      <button type="submit" className="underline hover:text-quake">
                        {c.hidden_at ? 'Show' : 'Hide'}
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          {canComment(f, viewer) ? (
            <CommentForm ideaId={idea.id} />
          ) : (
            <p className="text-sm text-ink/60 dark:text-paper/60">
              {f.isPublic
                ? 'The author has switched comments off.'
                : 'Private ideas have no comments.'}
            </p>
          )}
        </div>
      </section>

      <div className="mt-10">
        <VotingExplained compact />
      </div>
    </IdeasShell>
  );
}

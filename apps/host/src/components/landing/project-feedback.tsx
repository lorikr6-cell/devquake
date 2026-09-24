import { SectionLink } from '@/components/section-link';
import type { SessionUser } from '@/lib/auth/session';
import { toggleLikeAction } from '@/lib/feedback-actions';
import type { MyFeedback, ProjectFeedbackSummary } from '@/lib/project-feedback-rules';
import type { PublicProject } from '@/lib/public-projects';
import { RatingForm } from './rating-form';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Compact "♥ 12 · ★ 4.3" line for the card's always-visible header. */
export function FeedbackSummary({ feedback }: { feedback: ProjectFeedbackSummary }) {
  const stars = [feedback.quality, feedback.usefulness].filter((v): v is number => v !== null);
  const overall = stars.length
    ? Math.round((stars.reduce((a, b) => a + b, 0) / stars.length) * 10) / 10
    : null;
  return (
    <span className="inline-flex items-center gap-2 text-xs text-ink/60 tabular-nums dark:text-paper/60">
      <span title={plural(feedback.likes, 'like', 'likes')}>
        <span aria-hidden className="text-quake">
          ♥
        </span>{' '}
        {feedback.likes}
        <span className="sr-only">{feedback.likes === 1 ? ' like' : ' likes'}</span>
      </span>
      {overall !== null ? (
        <span title={`Average rating from ${plural(feedback.ratings, 'person', 'people')}`}>
          <span aria-hidden className="text-quake">
            ★
          </span>{' '}
          {overall.toFixed(1)}
          <span className="sr-only"> out of 5</span>
        </span>
      ) : null}
    </span>
  );
}

/**
 * Like button and ratings inside an opened project card. Everyone sees the averages; signed-in
 * users can like any project and rate live ones.
 */
export function ProjectFeedback({
  project,
  user,
  mine,
}: {
  project: PublicProject;
  user: SessionUser | null;
  mine: MyFeedback | undefined;
}) {
  const { feedback } = project;
  const liked = !!mine?.liked;
  return (
    <div className="mt-5 space-y-4 border-t border-ink/10 pt-4 dark:border-paper/10">
      <div className="flex flex-wrap items-center gap-3">
        {user ? (
          <form action={toggleLikeAction.bind(null, project.id)}>
            <button
              type="submit"
              aria-pressed={liked}
              className={
                liked
                  ? 'inline-flex items-center gap-1.5 rounded-md bg-quake/10 px-3 py-1.5 text-sm font-medium text-quake hover:bg-quake/15 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none'
                  : 'inline-flex items-center gap-1.5 rounded-md border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none dark:border-paper/20 dark:hover:bg-paper/10'
              }
            >
              <span aria-hidden>{liked ? '♥' : '♡'}</span>
              {liked ? 'Liked' : 'Like'} · {feedback.likes}
            </button>
          </form>
        ) : (
          <p className="text-sm text-ink/70 dark:text-paper/70">
            <span aria-hidden className="text-quake">
              ♥
            </span>{' '}
            {plural(feedback.likes, 'like', 'likes')} ·{' '}
            <SectionLink
              href="/#account"
              tab="signin"
              className="font-medium underline decoration-quake underline-offset-2"
            >
              Sign in
            </SectionLink>{' '}
            to like and rate.
          </p>
        )}
        {feedback.ratings > 0 ? (
          <p className="text-xs text-ink/70 tabular-nums dark:text-paper/70">
            Quality {feedback.quality?.toFixed(1) ?? '–'} · Usefulness{' '}
            {feedback.usefulness?.toFixed(1) ?? '–'} (out of 5, from{' '}
            {plural(feedback.ratings, 'rating', 'ratings')})
          </p>
        ) : null}
      </div>
      {user && project.url ? (
        <RatingForm
          projectId={project.id}
          quality={mine?.quality ?? null}
          usefulness={mine?.usefulness ?? null}
        />
      ) : user ? (
        <p className="text-xs text-ink/60 dark:text-paper/60">Ratings open once the app is live.</p>
      ) : null}
    </div>
  );
}

import { rich, type Translate } from '@devquake/ui';
import { SectionLink } from '@/components/section-link';
import { getT } from '@/i18n/server';
import type { SessionUser } from '@/lib/auth/session';
import { toggleLikeAction } from '@/lib/feedback-actions';
import type { MyFeedback, ProjectFeedbackSummary } from '@/lib/project-feedback-rules';
import type { PublicProject } from '@/lib/public-projects';
import { RatingForm } from './rating-form';

/** Compact "♥ 12 · ★ 4.3" line for the card's always-visible header. */
export function FeedbackSummary({
  feedback,
  t,
}: {
  feedback: ProjectFeedbackSummary;
  /** landing.feedback texts. */
  t: Translate;
}) {
  const stars = [feedback.quality, feedback.usefulness].filter((v): v is number => v !== null);
  const overall = stars.length
    ? Math.round((stars.reduce((a, b) => a + b, 0) / stars.length) * 10) / 10
    : null;
  return (
    <span className="inline-flex items-center gap-2 text-xs text-ink/60 tabular-nums dark:text-paper/60">
      <span title={t('likes', { count: feedback.likes })}>
        <span aria-hidden className="text-quake">
          ♥
        </span>{' '}
        <span aria-hidden>{feedback.likes}</span>
        <span className="sr-only">{t('likes', { count: feedback.likes })}</span>
      </span>
      {overall !== null ? (
        <span title={t('averageTitle', { ratings: t('ratings', { count: feedback.ratings }) })}>
          <span aria-hidden className="text-quake">
            ★
          </span>{' '}
          {overall.toFixed(1)}
          <span className="sr-only"> {t('outOf5')}</span>{' '}
          <span aria-hidden>({feedback.ratings})</span>
          <span className="sr-only">{t('ratings', { count: feedback.ratings })}</span>
        </span>
      ) : null}
    </span>
  );
}

/**
 * Like button and ratings inside an opened project card. Everyone sees the averages; signed-in
 * users can like any project and rate live ones.
 */
export async function ProjectFeedback({
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
  const t = await getT('landing.feedback');
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
              {liked ? t('liked') : t('like')} · {feedback.likes}
            </button>
          </form>
        ) : (
          <p className="text-sm text-ink/70 dark:text-paper/70">
            <span aria-hidden className="text-quake">
              ♥
            </span>{' '}
            {rich(t('toLike'), {
              likes: t('likes', { count: feedback.likes }),
              link: (
                <SectionLink
                  href="/#account"
                  tab="signin"
                  className="font-medium underline decoration-quake underline-offset-2"
                >
                  {t('signIn')}
                </SectionLink>
              ),
            })}
          </p>
        )}
        {feedback.ratings > 0 ? (
          <p className="text-xs text-ink/70 tabular-nums dark:text-paper/70">
            {t('summary', {
              quality: feedback.quality?.toFixed(1) ?? '–',
              usefulness: feedback.usefulness?.toFixed(1) ?? '–',
              ratings: t('ratings', { count: feedback.ratings }),
            })}
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
        <p className="text-xs text-ink/60 dark:text-paper/60">{t('openLive')}</p>
      ) : null}
    </div>
  );
}

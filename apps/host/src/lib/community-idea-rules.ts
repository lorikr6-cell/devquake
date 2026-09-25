// Community ideas: validation and who may see, vote on and comment on what. Pure and tested;
// the database side is in community-ideas.ts.

export const COMMUNITY_STATUSES = ['open', 'under_review', 'accepted', 'declined'] as const;
export type CommunityStatus = (typeof COMMUNITY_STATUSES)[number];

export const COMMUNITY_STATUS_LABELS: Record<CommunityStatus, string> = {
  open: 'Open for votes',
  under_review: 'Under review',
  accepted: 'Accepted',
  declined: 'Not planned',
};

export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 5000;
export const COMMENT_MAX = 2000;
export const STAFF_NOTE_MAX = 500;
/** Pictures are shrunk in the browser first (usually 150–400 KB). */
export const MAX_IDEA_IMAGE_BYTES = 1536 * 1024;
/** Spam brakes. */
export const MAX_IDEAS_PER_DAY = 10;
export const MAX_COMMENTS_PER_10_MIN = 10;

export interface IdeaInput {
  title: string;
  description: string | null;
  projectId: number | null;
  isPublic: boolean;
  votesEnabled: boolean;
  commentsEnabled: boolean;
}

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

const clean = (value: FormDataEntryValue | null) =>
  typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim() : '';

/** The idea form (users and staff use the same fields). */
export function checkIdeaForm(form: FormData, projectIds: number[]): Checked<IdeaInput> {
  const title = clean(form.get('title')).replace(/\s+/g, ' ');
  if (title.length < 3)
    return { ok: false, error: 'Give your idea a title (at least 3 characters).' };
  if (title.length > TITLE_MAX)
    return { ok: false, error: `Keep the title under ${TITLE_MAX} characters.` };
  const description = clean(form.get('description'));
  if (description.length > DESCRIPTION_MAX) {
    return { ok: false, error: `Keep the description under ${DESCRIPTION_MAX} characters.` };
  }
  const project = clean(form.get('project_id'));
  const projectId = project ? Number(project) : null;
  if (projectId !== null && !projectIds.includes(projectId)) {
    return { ok: false, error: 'Choose one of the listed projects, or “A new app”.' };
  }
  return {
    ok: true,
    value: {
      title,
      description: description || null,
      projectId,
      isPublic: form.get('is_public') === 'on',
      votesEnabled: form.get('votes_enabled') === 'on',
      commentsEnabled: form.get('comments_enabled') === 'on',
    },
  };
}

export function checkComment(value: FormDataEntryValue | null): Checked<string> {
  const body = clean(value);
  if (!body) return { ok: false, error: 'Write a comment first.' };
  if (body.length > COMMENT_MAX)
    return { ok: false, error: `Keep it under ${COMMENT_MAX} characters.` };
  return { ok: true, value: body };
}

export interface IdeaAccessFacts {
  authorUserId: number;
  isPublic: boolean;
  hidden: boolean;
  votesEnabled: boolean;
  commentsEnabled: boolean;
}

export interface Viewer {
  userId: number;
  isAdmin: boolean;
}

/**
 * Private ideas: only their author. Public ideas: every signed-in user, unless hidden by
 * moderation (then the author and staff only). Staff see public and hidden ideas, never other
 * people's private ones.
 */
export function canSeeIdea(idea: IdeaAccessFacts, viewer: Viewer | null): boolean {
  if (!viewer) return false;
  if (idea.authorUserId === viewer.userId) return true;
  if (!idea.isPublic) return false;
  return !idea.hidden || viewer.isAdmin;
}

/** Voting and commenting: on visible, public, not hidden ideas where the author allows it. */
export function canVote(idea: IdeaAccessFacts, viewer: Viewer | null): boolean {
  return !!viewer && idea.isPublic && !idea.hidden && idea.votesEnabled && canSeeIdea(idea, viewer);
}

export function canComment(idea: IdeaAccessFacts, viewer: Viewer | null): boolean {
  return (
    !!viewer && idea.isPublic && !idea.hidden && idea.commentsEnabled && canSeeIdea(idea, viewer)
  );
}

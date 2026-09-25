import 'server-only';
import { projectDescriptionFromIdea, slugify, uniqueSlug } from './idea-to-project';
import { logActivity } from './activity';
import type { SessionUser } from './auth/session';
import { sniffImageType } from './avatars';
import { execute, getPool, query, queryOne, type Row } from './db';
import {
  MAX_COMMENTS_PER_10_MIN,
  MAX_IDEAS_PER_DAY,
  MAX_IDEA_IMAGE_BYTES,
  STAFF_NOTE_MAX,
  canComment,
  canSeeIdea,
  canVote,
  type CommunityStatus,
  type IdeaAccessFacts,
  type IdeaInput,
  type Viewer,
} from './community-idea-rules';

/**
 * Community ideas (migration 0013): proposals by signed-in users, with an optional picture,
 * votes and comments. Visibility rules live in community-idea-rules.ts; every function here
 * applies them again, whatever the page already checked.
 */

export interface CommunityIdea extends Row {
  id: number;
  author_user_id: number;
  author_name: string;
  project_id: number | null;
  project_name: string | null;
  title: string;
  description: string | null;
  is_public: number;
  votes_enabled: number;
  comments_enabled: number;
  status: CommunityStatus;
  staff_note: string | null;
  roadmap_idea_id: number | null;
  hidden_at: Date | null;
  created_at: Date;
  updated_at: Date;
  votes: number;
  comments: number;
  /** Picture version (upload time) or null. */
  image_v: number | null;
  my_vote: number;
}

export const facts = (i: CommunityIdea): IdeaAccessFacts => ({
  authorUserId: i.author_user_id,
  isPublic: i.is_public === 1,
  hidden: i.hidden_at !== null,
  votesEnabled: i.votes_enabled === 1,
  commentsEnabled: i.comments_enabled === 1,
});

export const viewerOf = (user: SessionUser | null): Viewer | null =>
  user ? { userId: user.userId, isAdmin: user.isAdmin } : null;

const SELECT = `
  SELECT i.*, u.display_name AS author_name, p.name AS project_name,
         (SELECT COUNT(*) FROM community_idea_votes v WHERE v.idea_id = i.id) AS votes,
         (SELECT COUNT(*) FROM community_idea_comments c
           WHERE c.idea_id = i.id AND c.hidden_at IS NULL) AS comments,
         UNIX_TIMESTAMP(img.updated_at) AS image_v,
         EXISTS (SELECT 1 FROM community_idea_votes mv WHERE mv.idea_id = i.id AND mv.user_id = ?) AS my_vote
    FROM community_ideas i
    JOIN users u ON u.id = i.author_user_id
    LEFT JOIN projects p ON p.id = i.project_id
    LEFT JOIN community_idea_images img ON img.idea_id = i.id`;

export type IdeaSort = 'top' | 'new';

/** Ideas a viewer may see: public ones (not hidden), plus their own; staff also hidden ones. */
export async function listIdeas(
  viewer: Viewer,
  options: { sort?: IdeaSort; mine?: boolean; projectId?: number | null } = {},
): Promise<CommunityIdea[]> {
  const where: string[] = [];
  const params: unknown[] = [viewer.userId];
  if (options.mine) {
    where.push('i.author_user_id = ?');
    params.push(viewer.userId);
  } else {
    where.push(
      viewer.isAdmin
        ? '(i.is_public = 1 OR i.author_user_id = ?)'
        : '((i.is_public = 1 AND i.hidden_at IS NULL) OR i.author_user_id = ?)',
    );
    params.push(viewer.userId);
  }
  if (options.projectId === 0) where.push('i.project_id IS NULL');
  else if (options.projectId) {
    where.push('i.project_id = ?');
    params.push(options.projectId);
  }
  const order =
    options.sort === 'new' ? 'i.created_at DESC' : 'votes DESC, comments DESC, i.created_at DESC';
  return query<CommunityIdea>(
    `${SELECT} WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT 200`,
    params,
  );
}

/** One idea, or null when it does not exist or the viewer may not see it. */
export async function getIdea(id: number, viewer: Viewer | null): Promise<CommunityIdea | null> {
  if (!viewer || !Number.isSafeInteger(id) || id <= 0) return null;
  const idea = await queryOne<CommunityIdea>(`${SELECT} WHERE i.id = ?`, [viewer.userId, id]);
  return idea && canSeeIdea(facts(idea), viewer) ? idea : null;
}

/** Projects an idea can be for: public, not archived. */
export function ideaProjects() {
  return query<Row & { id: number; name: string }>(
    "SELECT id, name FROM projects WHERE is_public = 1 AND status <> 'archived' ORDER BY name",
  );
}

/** `error` is a catalog key under ideas.errors (ADR 0011). */
export type Result = { ok: true; id?: number } | { ok: false; error: string };

export async function createIdea(user: SessionUser, input: IdeaInput): Promise<Result> {
  const [recent] = await query<Row & { n: number }>(
    `SELECT COUNT(*) AS n FROM community_ideas
      WHERE author_user_id = ? AND created_at > UTC_TIMESTAMP() - INTERVAL 1 DAY`,
    [user.userId],
  );
  if (Number(recent?.n) >= MAX_IDEAS_PER_DAY) {
    return { ok: false, error: 'tooManyIdeas' };
  }
  const { insertId } = await execute(
    `INSERT INTO community_ideas
       (author_user_id, project_id, title, description, is_public, votes_enabled, comments_enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      user.userId,
      input.projectId,
      input.title,
      input.description,
      input.isPublic,
      input.votesEnabled,
      input.commentsEnabled,
    ],
  );
  await logActivity({
    source: 'host',
    action: 'community.idea.created',
    message: input.title,
    actorUserId: user.userId,
    entityType: 'community_idea',
    entityId: insertId,
  });
  return { ok: true, id: insertId };
}

async function ownIdea(user: SessionUser, id: number) {
  return queryOne<Row & { id: number; title: string }>(
    'SELECT id, title FROM community_ideas WHERE id = ? AND author_user_id = ?',
    [id, user.userId],
  );
}

export async function updateIdea(user: SessionUser, id: number, input: IdeaInput): Promise<Result> {
  if (!(await ownIdea(user, id))) return { ok: false, error: 'notAuthor' };
  await execute(
    `UPDATE community_ideas
        SET project_id = ?, title = ?, description = ?, is_public = ?, votes_enabled = ?,
            comments_enabled = ?
      WHERE id = ?`,
    [
      input.projectId,
      input.title,
      input.description,
      input.isPublic,
      input.votesEnabled,
      input.commentsEnabled,
      id,
    ],
  );
  return { ok: true, id };
}

/** The author deletes their idea, or staff remove it (moderation). */
export async function deleteIdea(user: SessionUser, id: number): Promise<Result> {
  const idea = await queryOne<Row & { title: string; author_user_id: number }>(
    'SELECT title, author_user_id FROM community_ideas WHERE id = ?',
    [id],
  );
  if (!idea) return { ok: false, error: 'gone' };
  if (idea.author_user_id !== user.userId && !user.isAdmin) {
    return { ok: false, error: 'notAuthorDelete' };
  }
  await execute('DELETE FROM community_ideas WHERE id = ?', [id]);
  await logActivity({
    source: 'host',
    action: 'community.idea.deleted',
    message: idea.title,
    actorUserId: user.userId,
    entityType: 'community_idea',
    entityId: id,
    metadata: { byStaff: idea.author_user_id !== user.userId },
  });
  return { ok: true };
}

// --- picture -------------------------------------------------------------------------------

export async function saveIdeaImage(user: SessionUser, id: number, file: File): Promise<Result> {
  if (!(await ownIdea(user, id))) return { ok: false, error: 'notAuthorPicture' };
  if (file.size === 0) return { ok: true };
  if (file.size > MAX_IDEA_IMAGE_BYTES) return { ok: false, error: 'pictureTooLarge' };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImageType(bytes);
  if (!mime) return { ok: false, error: 'pictureFormat' };
  await execute(
    `INSERT INTO community_idea_images (idea_id, mime, data, bytes) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE mime = ?, data = ?, bytes = ?, updated_at = CURRENT_TIMESTAMP`,
    [id, mime, Buffer.from(bytes), bytes.length, mime, Buffer.from(bytes), bytes.length],
  );
  return { ok: true };
}

export async function removeIdeaImage(user: SessionUser, id: number): Promise<void> {
  if (await ownIdea(user, id)) {
    await execute('DELETE FROM community_idea_images WHERE idea_id = ?', [id]);
  }
}

/** The picture, only for viewers who may see the idea. */
export async function readIdeaImage(id: number, viewer: Viewer | null) {
  const idea = await getIdea(id, viewer);
  if (!idea) return null;
  return queryOne<Row & { mime: string; data: Buffer }>(
    'SELECT mime, data FROM community_idea_images WHERE idea_id = ?',
    [id],
  );
}

// --- votes and comments -------------------------------------------------------------------

/** Adds or removes the viewer's vote; returns whether they now vote for it. */
export async function toggleVote(user: SessionUser, id: number): Promise<boolean | null> {
  const viewer = viewerOf(user)!;
  const idea = await getIdea(id, viewer);
  if (!idea || !canVote(facts(idea), viewer)) return null;
  if (idea.my_vote) {
    await execute('DELETE FROM community_idea_votes WHERE idea_id = ? AND user_id = ?', [
      id,
      user.userId,
    ]);
    return false;
  }
  await execute('INSERT IGNORE INTO community_idea_votes (idea_id, user_id) VALUES (?, ?)', [
    id,
    user.userId,
  ]);
  return true;
}

export interface IdeaComment extends Row {
  id: number;
  user_id: number;
  author_name: string;
  body: string;
  hidden_at: Date | null;
  created_at: Date;
}

/** Comments of an idea; hidden ones only for staff (marked) and their author. */
export function listComments(ideaId: number, viewer: Viewer) {
  return query<IdeaComment>(
    `SELECT c.id, c.user_id, u.display_name AS author_name, c.body, c.hidden_at, c.created_at
       FROM community_idea_comments c JOIN users u ON u.id = c.user_id
      WHERE c.idea_id = ? AND (c.hidden_at IS NULL OR ? OR c.user_id = ?)
      ORDER BY c.created_at, c.id`,
    [ideaId, viewer.isAdmin, viewer.userId],
  );
}

export async function addComment(user: SessionUser, ideaId: number, body: string): Promise<Result> {
  const viewer = viewerOf(user)!;
  const idea = await getIdea(ideaId, viewer);
  if (!idea || !canComment(facts(idea), viewer)) {
    return { ok: false, error: 'commentsClosed' };
  }
  const [recent] = await query<Row & { n: number }>(
    `SELECT COUNT(*) AS n FROM community_idea_comments
      WHERE user_id = ? AND created_at > UTC_TIMESTAMP() - INTERVAL 10 MINUTE`,
    [user.userId],
  );
  if (Number(recent?.n) >= MAX_COMMENTS_PER_10_MIN) {
    return { ok: false, error: 'slowDown' };
  }
  const { insertId } = await execute(
    'INSERT INTO community_idea_comments (idea_id, user_id, body) VALUES (?, ?, ?)',
    [ideaId, user.userId, body],
  );
  return { ok: true, id: insertId };
}

/** The comment's author or staff delete a comment. */
export async function deleteComment(user: SessionUser, commentId: number): Promise<void> {
  await execute(`DELETE FROM community_idea_comments WHERE id = ? AND (user_id = ? OR ?)`, [
    commentId,
    user.userId,
    user.isAdmin,
  ]);
}

// --- staff ----------------------------------------------------------------------------------

export async function setIdeaReview(
  staff: SessionUser,
  id: number,
  status: CommunityStatus,
  note: string,
): Promise<void> {
  await execute('UPDATE community_ideas SET status = ?, staff_note = ? WHERE id = ?', [
    status,
    note.trim().slice(0, STAFF_NOTE_MAX) || null,
    id,
  ]);
  await logActivity({
    source: 'host',
    action: 'community.idea.reviewed',
    message: status,
    actorUserId: staff.userId,
    entityType: 'community_idea',
    entityId: id,
  });
}

export async function setIdeaHidden(staff: SessionUser, id: number, hidden: boolean) {
  await execute(
    `UPDATE community_ideas SET hidden_at = IF(?, COALESCE(hidden_at, UTC_TIMESTAMP()), NULL)
      WHERE id = ?`,
    [hidden, id],
  );
  await logActivity({
    source: 'host',
    action: hidden ? 'community.idea.hidden' : 'community.idea.shown',
    actorUserId: staff.userId,
    entityType: 'community_idea',
    entityId: id,
  });
}

export async function setCommentHidden(commentId: number, hidden: boolean) {
  await execute(
    `UPDATE community_idea_comments SET hidden_at = IF(?, COALESCE(hidden_at, UTC_TIMESTAMP()), NULL)
      WHERE id = ?`,
    [hidden, commentId],
  );
}

/**
 * Staff turn a community idea into a roadmap idea (private at first, in /admin-cp/ideas) and
 * mark it accepted. Returns the roadmap idea's id.
 */
export async function addToRoadmap(staff: SessionUser, id: number): Promise<number | null> {
  const idea = await queryOne<
    Row & {
      title: string;
      description: string | null;
      project_id: number | null;
      author_name: string;
    }
  >(
    `SELECT i.title, i.description, i.project_id, u.display_name AS author_name
       FROM community_ideas i JOIN users u ON u.id = i.author_user_id
      WHERE i.id = ? AND i.roadmap_idea_id IS NULL`,
    [id],
  );
  if (!idea) return null;
  const summary =
    `${idea.description ?? ''}\n\nFrom community idea #${id} by ${idea.author_name}.`.trim();
  const { insertId } = await execute(
    `INSERT INTO ideas (project_id, title, summary, status, priority, created_by, updated_by)
     VALUES (?, ?, ?, 'idea', 'medium', ?, ?)`,
    [idea.project_id, idea.title, summary, staff.userId, staff.userId],
  );
  await execute(
    "UPDATE community_ideas SET roadmap_idea_id = ?, status = 'accepted' WHERE id = ?",
    [insertId, id],
  );
  await logActivity({
    source: 'host',
    action: 'community.idea.roadmap',
    message: idea.title,
    actorUserId: staff.userId,
    entityType: 'idea',
    entityId: insertId,
    metadata: { communityIdeaId: id },
  });
  return insertId;
}

/**
 * Staff turn a community idea into a project (ADR 0020): a new private project whose description
 * holds the idea's text, its author, how many members voted and who, and the comments. The idea
 * itself (with its picture, votes and comments) is then deleted. Returns the project's id.
 */
export async function convertIdeaToProject(staff: SessionUser, id: number): Promise<number | null> {
  const idea = await queryOne<
    Row & { title: string; description: string | null; author_name: string }
  >(
    `SELECT i.title, i.description, u.display_name AS author_name
       FROM community_ideas i JOIN users u ON u.id = i.author_user_id
      WHERE i.id = ? AND i.is_public = 1`,
    [id],
  );
  if (!idea) return null;
  const [voters, comments, slugs] = await Promise.all([
    query<Row & { display_name: string }>(
      `SELECT u.display_name FROM community_idea_votes v JOIN users u ON u.id = v.user_id
        WHERE v.idea_id = ? ORDER BY v.created_at`,
      [id],
    ),
    query<Row & { display_name: string; body: string }>(
      `SELECT u.display_name, c.body FROM community_idea_comments c
         JOIN users u ON u.id = c.user_id
        WHERE c.idea_id = ? AND c.hidden_at IS NULL ORDER BY c.created_at`,
      [id],
    ),
    query<Row & { slug: string }>('SELECT slug FROM projects'),
  ]);
  const slug = uniqueSlug(slugify(idea.title), new Set(slugs.map((r) => r.slug)));
  const description = projectDescriptionFromIdea({
    id,
    description: idea.description,
    author: idea.author_name,
    voters: voters.map((v) => v.display_name),
    comments: comments.map((c) => ({ author: c.display_name, body: c.body })),
  });

  const conn = await getPool().getConnection();
  let projectId: number;
  try {
    await conn.beginTransaction();
    const [result] = await conn.query<import('mysql2').ResultSetHeader>(
      // Private and offline until an admin publishes it; a plugin project named by its slug.
      `INSERT INTO projects (slug, name, kind, plugin_id, description, is_public, created_by, sort_order)
       SELECT ?, ?, 'plugin', ?, ?, 0, ?, COALESCE(MAX(sort_order), 0) + 10 FROM projects`,
      [slug, idea.title.slice(0, 120), slug, description, staff.userId],
    );
    projectId = result.insertId;
    await conn.query('DELETE FROM community_ideas WHERE id = ?', [id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
  await logActivity({
    source: 'admin-cp',
    action: 'community.idea.project',
    message: idea.title,
    actorUserId: staff.userId,
    entityType: 'project',
    entityId: projectId,
    metadata: { communityIdeaId: id, votes: voters.length, comments: comments.length },
  });
  return projectId;
}

/** Staff list (control panel): public ideas including hidden ones; never private ones. */
export function listIdeasForStaff(staff: Viewer, status?: CommunityStatus) {
  const params: unknown[] = [staff.userId];
  let where = 'i.is_public = 1';
  if (status) {
    where += ' AND i.status = ?';
    params.push(status);
  }
  return query<CommunityIdea>(
    `${SELECT} WHERE ${where} ORDER BY i.hidden_at IS NOT NULL, votes DESC, i.created_at DESC LIMIT 500`,
    params,
  );
}

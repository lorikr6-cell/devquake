import 'server-only';
import { logActivity } from './activity';
import type { SessionUser } from './auth/session';
import { execute, query, queryOne, type Row } from './db';
import { pluginSubdomains } from '@/plugins/registry.manifest.generated';
import type { RequestInfo } from './request';
import { isRating, type MyFeedback, type ProjectFeedbackSummary } from './project-feedback-rules';

/**
 * Likes and ratings of public projects (migration 0012). Anyone signed in can like a public
 * project; only live projects (online and deployed) can be rated, on quality and usefulness.
 */

interface SummaryRow extends Row {
  project_id: number;
  likes: number | string;
  ratings: number | string;
  quality: number | string | null;
  usefulness: number | string | null;
}

const avg = (v: number | string | null) => (v === null ? null : Math.round(Number(v) * 10) / 10);

export async function feedbackSummaries(): Promise<Map<number, ProjectFeedbackSummary>> {
  const rows = await query<SummaryRow>(
    `SELECT project_id, SUM(liked) AS likes,
            SUM(quality IS NOT NULL OR usefulness IS NOT NULL) AS ratings,
            AVG(quality) AS quality, AVG(usefulness) AS usefulness
       FROM project_feedback GROUP BY project_id`,
  );
  return new Map(
    rows.map((r) => [
      r.project_id,
      {
        likes: Number(r.likes ?? 0),
        ratings: Number(r.ratings ?? 0),
        quality: avg(r.quality),
        usefulness: avg(r.usefulness),
      },
    ]),
  );
}

export async function myFeedback(userId: number): Promise<Map<number, MyFeedback>> {
  const rows = await query<
    Row & { project_id: number; liked: number; quality: number | null; usefulness: number | null }
  >('SELECT project_id, liked, quality, usefulness FROM project_feedback WHERE user_id = ?', [
    userId,
  ]);
  return new Map(
    rows.map((r) => [
      r.project_id,
      { liked: Number(r.liked) === 1, quality: r.quality, usefulness: r.usefulness },
    ]),
  );
}

async function publicProject(projectId: number) {
  return queryOne<Row & { id: number; name: string; plugin_id: string | null; is_online: number }>(
    `SELECT id, name, plugin_id, is_online FROM projects
      WHERE id = ? AND is_public = 1 AND status <> 'archived'`,
    [projectId],
  );
}

/** Likes or un-likes a public project; returns the new state (null = unknown project). */
export async function toggleLike(
  user: SessionUser,
  projectId: number,
  info: RequestInfo,
): Promise<boolean | null> {
  const project = await publicProject(projectId);
  if (!project) return null;
  await execute(
    `INSERT INTO project_feedback (user_id, project_id, liked) VALUES (?, ?, 1)
     ON DUPLICATE KEY UPDATE liked = 1 - liked`,
    [user.userId, projectId],
  );
  const row = await queryOne<Row & { liked: number }>(
    'SELECT liked FROM project_feedback WHERE user_id = ? AND project_id = ?',
    [user.userId, projectId],
  );
  const liked = Number(row?.liked) === 1;
  await logActivity({
    source: 'host',
    action: liked ? 'project.liked' : 'project.unliked',
    message: project.name,
    actorUserId: user.userId,
    entityType: 'project',
    entityId: projectId,
    ip: info.ip,
    userAgent: info.userAgent,
  });
  return liked;
}

export type RateResult = 'ok' | 'not_found' | 'not_live' | 'invalid';

/** Saves the user's quality and usefulness rating (1..5 each, at least one) of a live project. */
export async function rateProject(
  user: SessionUser,
  projectId: number,
  quality: number | null,
  usefulness: number | null,
  info: RequestInfo,
): Promise<RateResult> {
  if ((quality !== null && !isRating(quality)) || (usefulness !== null && !isRating(usefulness))) {
    return 'invalid';
  }
  if (quality === null && usefulness === null) return 'invalid';
  const project = await publicProject(projectId);
  if (!project) return 'not_found';
  const live =
    project.is_online === 1 &&
    !!project.plugin_id &&
    (pluginSubdomains as readonly string[]).includes(project.plugin_id);
  if (!live) return 'not_live';
  await execute(
    `INSERT INTO project_feedback (user_id, project_id, quality, usefulness) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE quality = ?, usefulness = ?`,
    [user.userId, projectId, quality, usefulness, quality, usefulness],
  );
  await logActivity({
    source: 'host',
    action: 'project.rated',
    message: project.name,
    actorUserId: user.userId,
    entityType: 'project',
    entityId: projectId,
    ip: info.ip,
    userAgent: info.userAgent,
    metadata: { quality, usefulness },
  });
  return 'ok';
}

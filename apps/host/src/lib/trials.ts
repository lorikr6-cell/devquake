import 'server-only';
import { cache } from 'react';
import { logActivity } from './activity';
import { ROLE_ADMIN, ROLE_OWNER, type SessionUser } from './auth/session';
import { execute, query, queryOne, type Row } from './db';
import { deleteUserDataInPlugin } from './plugin-platform';
import type { RequestInfo } from './request';
import { getMemberships } from './subscriptions';
import { TRIAL_DATA_KEEP_DAYS, TRIAL_HOURS, trialState, type TrialRecord } from './trial-rules';

/**
 * 24-hour trials of a project's app (ADR 0016, migration 0018). A member who is not subscribed
 * can try each app once: for 24 hours it opens as if they were subscribed, without spending NPS
 * points. Afterwards it needs a subscription. What they created during the trial is deleted by
 * the app TRIAL_DATA_KEEP_DAYS after the trial ended, unless they subscribed.
 */

/** The member's trials by project id (started or ended). Empty before migration 0018. */
export const getTrials = cache(async (userId: number): Promise<Map<number, TrialRecord>> => {
  const rows = await query<Row & { project_id: number; started_at: Date; expires_at: Date }>(
    'SELECT project_id, started_at, expires_at FROM project_trials WHERE user_id = ?',
    [userId],
  ).catch(() => []);
  return new Map(
    rows.map((r) => [
      Number(r.project_id),
      { startedAt: new Date(r.started_at), expiresAt: new Date(r.expires_at) },
    ]),
  );
});

/** Is the member's trial of this project running right now? */
export async function hasActiveTrial(userId: number, projectId: number): Promise<boolean> {
  const trial = (await getTrials(userId)).get(projectId);
  return trialState(trial, new Date()).kind === 'active';
}

export type StartTrialResult = 'ok' | 'used' | 'member' | 'unavailable';

/** Starts the member's one trial of the project's app (it must be online). */
export async function startTrial(
  user: SessionUser,
  projectId: number,
  info: RequestInfo,
): Promise<StartTrialResult> {
  const project = await queryOne<Row & { name: string; plugin_id: string | null }>(
    `SELECT name, plugin_id FROM projects
      WHERE id = ? AND is_public = 1 AND is_online = 1 AND status <> 'archived'
        AND plugin_id IS NOT NULL`,
    [projectId],
  );
  if (!project) return 'unavailable';
  if (user.isAdmin || (await getMemberships(user.userId)).has(projectId)) return 'member';
  // The primary key (user, project) makes the trial once-only, even with two clicks at once.
  const inserted = await execute(
    `INSERT IGNORE INTO project_trials (user_id, project_id, started_at, expires_at)
     VALUES (?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP() + INTERVAL ? HOUR)`,
    [user.userId, projectId, TRIAL_HOURS],
  );
  if (inserted.affectedRows !== 1) return 'used';
  await logActivity({
    source: 'host',
    action: 'project.trial.started',
    message: project.name,
    actorUserId: user.userId,
    entityType: 'project',
    entityId: projectId,
    ip: info.ip,
    userAgent: info.userAgent,
  });
  return 'ok';
}

/** How many members tried each project (admin overview). Empty before migration 0018. */
export async function trialCounts(): Promise<Map<number, number>> {
  const rows = await query<Row & { project_id: number; n: number }>(
    'SELECT project_id, COUNT(*) AS n FROM project_trials GROUP BY project_id',
  ).catch(() => []);
  return new Map(rows.map((r) => [Number(r.project_id), Number(r.n)]));
}

/**
 * Deletes, through each app's deleteUserData hook, what members created during trials that
 * ended more than TRIAL_DATA_KEEP_DAYS ago without a subscription (the platform's clean-up rule:
 * no app keeps data of people who left). Runs with the daily retention; a batch per run.
 */
export async function cleanUpEndedTrials(limit = 50): Promise<void> {
  const rows = await query<Row & { user_id: number; project_id: number; plugin_id: string | null }>(
    `SELECT t.user_id, t.project_id, p.plugin_id
       FROM project_trials t JOIN projects p ON p.id = t.project_id
      WHERE t.data_deleted_at IS NULL
        AND t.expires_at < UTC_TIMESTAMP() - INTERVAL ? DAY
        AND NOT EXISTS (SELECT 1 FROM project_subscriptions s
                         WHERE s.user_id = t.user_id AND s.project_id = t.project_id)
        AND NOT EXISTS (SELECT 1 FROM user_projects up
                         WHERE up.user_id = t.user_id AND up.project_id = t.project_id)
        AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                         WHERE ur.user_id = t.user_id AND r.code IN (?, ?))
      LIMIT ?`,
    [TRIAL_DATA_KEEP_DAYS, ROLE_OWNER, ROLE_ADMIN, limit],
  );
  for (const row of rows) {
    try {
      if (row.plugin_id) await deleteUserDataInPlugin(row.plugin_id, row.user_id);
      await execute(
        `UPDATE project_trials SET data_deleted_at = UTC_TIMESTAMP()
          WHERE user_id = ? AND project_id = ?`,
        [row.user_id, row.project_id],
      );
    } catch (err) {
      // Tried again at the next run; nothing is marked deleted until the app confirms it.
      console.error('[trials] app data clean-up failed', row.plugin_id, err);
    }
  }
}

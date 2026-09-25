import 'server-only';
import { cache } from 'react';
import { logActivity } from './activity';
import { deleteUserDataInPlugin } from './plugin-platform';
import type { SessionUser } from './auth/session';
import { execute, getPool, query, queryOne, type Row } from './db';
import { missingPoints, subscriptionCost } from './nps-rules';
import type { RequestInfo } from './request';

/**
 * Project subscriptions (ADR 0006). A signed-in user subscribes to a public project; its app on
 * <plugin_id>.devquake.com then opens for them once it is online. Access to an app is granted
 * to: subscribers, users the owner assigned to the project (user_projects), and admins/owner.
 */

export interface ProjectMembership {
  projectId: number;
  /** 'subscribed' can be undone by the user; 'assigned' is managed by the owner. */
  kind: 'subscribed' | 'assigned';
}

/** Projects the user is subscribed or assigned to (assignment wins if both). Cached per request. */
export const getMemberships = cache(
  async (userId: number): Promise<Map<number, ProjectMembership['kind']>> => {
    const rows = await query<Row & { project_id: number; kind: ProjectMembership['kind'] }>(
      `SELECT project_id, 'assigned' AS kind FROM user_projects WHERE user_id = ?
     UNION ALL
     SELECT project_id, 'subscribed' AS kind FROM project_subscriptions WHERE user_id = ?`,
      [userId, userId],
    );
    const map = new Map<number, ProjectMembership['kind']>();
    for (const r of rows) {
      if (map.get(r.project_id) !== 'assigned') map.set(r.project_id, r.kind);
    }
    return map;
  },
);

/** A project can be subscribed to while it is public and not archived. */
async function subscribableProject(projectId: number) {
  return queryOne<Row & { id: number; name: string; nps_cost: number }>(
    `SELECT id, name, nps_cost FROM projects
      WHERE id = ? AND is_public = 1 AND status <> 'archived'`,
    [projectId],
  );
}

export type SubscribeResult = 'ok' | 'unavailable' | 'not-enough-points';

/**
 * Subscribes the user, paying the project's NPS cost from their points (ADR 0012). Admins and
 * members assigned to the project pay nothing. Balance check, payment and subscription happen
 * in one transaction, so two clicks cannot spend the points twice.
 */
export async function subscribe(
  user: SessionUser,
  projectId: number,
  info: RequestInfo,
): Promise<SubscribeResult> {
  const project = await subscribableProject(projectId);
  if (!project) return 'unavailable';
  const assigned = !!(await queryOne<Row & { user_id: number }>(
    'SELECT user_id FROM user_projects WHERE user_id = ? AND project_id = ?',
    [user.userId, projectId],
  ));
  const cost = subscriptionCost(Number(project.nps_cost), { isAdmin: user.isAdmin, assigned });

  const conn = await getPool().getConnection();
  let result: SubscribeResult | 'already' = 'ok';
  try {
    await conn.beginTransaction();
    const [[me]] = await conn.query<(Row & { nps: number })[]>(
      'SELECT nps FROM users WHERE id = ? FOR UPDATE',
      [user.userId],
    );
    const [existing] = await conn.query<Row[]>(
      'SELECT user_id FROM project_subscriptions WHERE user_id = ? AND project_id = ?',
      [user.userId, projectId],
    );
    if (existing.length > 0) result = 'already';
    else if (missingPoints(Number(me?.nps ?? 0), cost) > 0) result = 'not-enough-points';
    else {
      if (cost > 0) {
        await conn.query('UPDATE users SET nps = nps - ? WHERE id = ?', [cost, user.userId]);
      }
      await conn.query(
        'INSERT INTO project_subscriptions (user_id, project_id, nps_spent) VALUES (?, ?, ?)',
        [user.userId, projectId, cost],
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }

  if (result === 'ok') {
    await logActivity({
      source: 'host',
      action: 'project.subscribed',
      message: project.name,
      actorUserId: user.userId,
      entityType: 'project',
      entityId: projectId,
      ip: info.ip,
      userAgent: info.userAgent,
      metadata: { npsSpent: cost },
    });
  }
  return result === 'already' ? 'ok' : result;
}

/**
 * Ends a subscription: the user loses access to the project's app and everything they created
 * in it is deleted by the app (its deleteUserData hook) first. If the app cannot delete the
 * data, the subscription is kept and 'error' is returned.
 */
export async function unsubscribe(
  user: SessionUser,
  projectId: number,
  info: RequestInfo,
): Promise<'ok' | 'error'> {
  const project = await queryOne<Row & { name: string; plugin_id: string | null }>(
    'SELECT name, plugin_id FROM projects WHERE id = ?',
    [projectId],
  );
  const subscribed = await queryOne<Row & { user_id: number }>(
    'SELECT user_id FROM project_subscriptions WHERE user_id = ? AND project_id = ?',
    [user.userId, projectId],
  );
  if (!subscribed) return 'ok';
  if (project?.plugin_id) {
    try {
      await deleteUserDataInPlugin(project.plugin_id, user.userId);
    } catch {
      return 'error';
    }
  }
  const result = await execute(
    'DELETE FROM project_subscriptions WHERE user_id = ? AND project_id = ?',
    [user.userId, projectId],
  );
  if (result.affectedRows === 1) {
    await logActivity({
      source: 'host',
      action: 'project.unsubscribed',
      message: `${project?.name ?? projectId} (app data deleted)`,
      actorUserId: user.userId,
      entityType: 'project',
      entityId: projectId,
      ip: info.ip,
      userAgent: info.userAgent,
    });
  }
  return 'ok';
}

export interface PluginAccessProject {
  id: number;
  name: string;
}

/** The public project behind an app subdomain, if any. */
export async function projectForPlugin(pluginId: string): Promise<PluginAccessProject | null> {
  return queryOne<Row & PluginAccessProject>(
    `SELECT id, name FROM projects WHERE plugin_id = ? AND is_public = 1 AND status <> 'archived'
      ORDER BY is_online DESC LIMIT 1`,
    [pluginId],
  );
}

/** May this signed-in user use the app of this project? */
export async function canUseProjectApp(user: SessionUser, projectId: number): Promise<boolean> {
  if (user.isAdmin) return true;
  return (await getMemberships(user.userId)).has(projectId);
}

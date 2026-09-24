import 'server-only';
import { cache } from 'react';
import { logActivity } from './activity';
import type { SessionUser } from './auth/session';
import { execute, query, queryOne, type Row } from './db';
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
  return queryOne<Row & { id: number; name: string }>(
    `SELECT id, name FROM projects WHERE id = ? AND is_public = 1 AND status <> 'archived'`,
    [projectId],
  );
}

export async function subscribe(user: SessionUser, projectId: number, info: RequestInfo) {
  const project = await subscribableProject(projectId);
  if (!project) return false;
  const result = await execute(
    'INSERT IGNORE INTO project_subscriptions (user_id, project_id) VALUES (?, ?)',
    [user.userId, projectId],
  );
  if (result.affectedRows === 1) {
    await logActivity({
      source: 'host',
      action: 'project.subscribed',
      message: project.name,
      actorUserId: user.userId,
      entityType: 'project',
      entityId: projectId,
      ip: info.ip,
      userAgent: info.userAgent,
    });
  }
  return true;
}

export async function unsubscribe(user: SessionUser, projectId: number, info: RequestInfo) {
  const project = await queryOne<Row & { name: string }>('SELECT name FROM projects WHERE id = ?', [
    projectId,
  ]);
  const result = await execute(
    'DELETE FROM project_subscriptions WHERE user_id = ? AND project_id = ?',
    [user.userId, projectId],
  );
  if (result.affectedRows === 1) {
    await logActivity({
      source: 'host',
      action: 'project.unsubscribed',
      message: project?.name,
      actorUserId: user.userId,
      entityType: 'project',
      entityId: projectId,
      ip: info.ip,
      userAgent: info.userAgent,
    });
  }
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

import { cache } from 'react';
import type { PluginContext, PluginDefinition, PluginManifest } from '@devquake/plugin-sdk';
import { pluginLoaders } from '@/plugins/registry.generated';
import { queryOne, type Row } from './db';
import { getSessionUser } from './auth/session';
import { getRootDomain, hostUrl, pluginUrl, sessionSharedWithApps } from './domain';
import { canUseProjectApp, projectForPlugin } from './subscriptions';

/** Load a plugin by id (cached per request). Returns null if unknown or disabled. */
export const loadPlugin = cache(async (id: string): Promise<PluginDefinition | null> => {
  const loader = pluginLoaders[id];
  if (!loader) return null;
  const plugin = await loader();
  if (plugin.manifest.status === 'disabled') return null;
  return plugin;
});

export function buildPluginContext(manifest: PluginManifest): PluginContext {
  return {
    pluginId: manifest.id,
    rootDomain: getRootDomain(),
    baseUrl: pluginUrl(manifest.id),
    hostUrl: hostUrl(),
  };
}

/**
 * An app may only be visited once an admin has put its project online (and public) in
 * /admin-cp/projects.
 * Local development without a database (no MAIN_DB_NAME) allows every plugin; any database
 * error keeps the app closed.
 */
export const isPluginOnline = cache(async (id: string): Promise<boolean> => {
  if (!process.env.MAIN_DB_NAME) return true;
  try {
    const row = await queryOne<Row & { is_online: number }>(
      `SELECT (is_online = 1 AND is_public = 1) AS is_online FROM projects
        WHERE plugin_id = ? AND status <> 'archived'
        ORDER BY is_online DESC, is_public DESC LIMIT 1`,
      [id],
    );
    return row?.is_online === 1;
  } catch (err) {
    console.error('[plugins] online check failed', err);
    return false;
  }
});

export type AppAccess =
  { ok: true } | { ok: false; reason: 'signin' | 'subscribe'; projectName: string };

/**
 * Who may use an online app (ADR 0006): its subscribers, users the owner assigned to the
 * project, and admins. Local development without a database, or on plain "localhost" (where
 * the session cannot be shared with subdomains), allows everyone. Cached per request.
 */
export const appAccess = cache(async (id: string): Promise<AppAccess> => {
  if (!process.env.MAIN_DB_NAME || !sessionSharedWithApps()) return { ok: true };
  const project = await projectForPlugin(id);
  if (!project) return { ok: false, reason: 'signin', projectName: id };
  const user = await getSessionUser().catch(() => null);
  if (!user) return { ok: false, reason: 'signin', projectName: project.name };
  if (!(await canUseProjectApp(user, project.id))) {
    return { ok: false, reason: 'subscribe', projectName: project.name };
  }
  return { ok: true };
});

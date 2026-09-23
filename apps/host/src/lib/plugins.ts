import { cache } from 'react';
import type { PluginContext, PluginDefinition, PluginManifest } from '@devquake/plugin-sdk';
import { pluginLoaders } from '@/plugins/registry.generated';
import { queryOne, type Row } from './db';
import { getRootDomain, hostUrl, pluginUrl } from './domain';

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
 * An app may only be visited once an admin has put its project online in /admin-cp/projects.
 * Local development without a database (no MAIN_DB_NAME) allows every plugin; any database
 * error keeps the app closed.
 */
export const isPluginOnline = cache(async (id: string): Promise<boolean> => {
  if (!process.env.MAIN_DB_NAME) return true;
  try {
    const row = await queryOne<Row & { is_online: number }>(
      `SELECT is_online FROM projects WHERE plugin_id = ? AND status <> 'archived'
        ORDER BY is_online DESC LIMIT 1`,
      [id],
    );
    return row?.is_online === 1;
  } catch (err) {
    console.error('[plugins] online check failed', err);
    return false;
  }
});

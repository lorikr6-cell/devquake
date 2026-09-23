import { cache } from 'react';
import type { PluginContext, PluginDefinition, PluginManifest } from '@devquake/plugin-sdk';
import { pluginLoaders } from '@/plugins/registry.generated';
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

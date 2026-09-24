import 'server-only';
import type { PluginPlatformContext, PluginPlatformModule, PluginStat } from '@devquake/plugin-sdk';
import { pluginLoaders } from '@/plugins/registry.generated';
import { pluginDatabase } from './plugin-db';

/**
 * Calls the optional platform hooks of every registered plugin (ADR 0007). Plugins are loaded
 * lazily; a plugin without hooks costs nothing.
 */
async function eachPlatformModule<T>(
  fn: (
    id: string,
    name: string,
    mod: PluginPlatformModule,
    ctx: PluginPlatformContext,
  ) => Promise<T>,
): Promise<T[]> {
  const out: T[] = [];
  for (const [id, load] of Object.entries(pluginLoaders)) {
    const plugin = await load();
    if (!plugin.platform) continue;
    const mod = await plugin.platform();
    const ctx: PluginPlatformContext = {
      pluginId: id,
      db: plugin.manifest.database ? pluginDatabase(id) : undefined,
    };
    out.push(await fn(id, plugin.manifest.name, mod, ctx));
  }
  return out;
}

export interface PluginStatsBlock {
  pluginId: string;
  name: string;
  stats: PluginStat[];
  error?: string;
}

/** Stats from every plugin for the admin dashboard. A failing plugin reports an error only. */
export async function collectPluginStats(): Promise<PluginStatsBlock[]> {
  const blocks = await eachPlatformModule(
    async (id, name, mod, ctx): Promise<PluginStatsBlock | null> => {
      if (!mod.getStats) return null;
      try {
        return { pluginId: id, name, stats: await mod.getStats(ctx) };
      } catch (err) {
        console.error(`[plugins] getStats failed for ${id}`, err);
        return { pluginId: id, name, stats: [], error: 'Stats unavailable' };
      }
    },
  );
  return blocks.filter((b): b is PluginStatsBlock => b !== null);
}

/**
 * GDPR: asks every plugin to remove the user's data. Throws if any plugin fails, so the account
 * deletion is aborted rather than leaving personal data behind in a plugin database.
 */
export async function deleteUserDataInPlugins(userId: number): Promise<void> {
  await eachPlatformModule(async (id, _name, mod, ctx) => {
    if (!mod.deleteUserData) return;
    try {
      await mod.deleteUserData(userId, ctx);
    } catch (err) {
      console.error(`[plugins] deleteUserData failed for ${id}`, err);
      throw new Error(`Plugin "${id}" could not delete the user's data`);
    }
  });
}

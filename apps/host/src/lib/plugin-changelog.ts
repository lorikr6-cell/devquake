import { parseChangelog, type PluginChangelogEntry } from '@devquake/plugin-sdk';
import { pluginChangelogSources } from '@/plugins/registry.changelog.generated';

const parsed = new Map<string, PluginChangelogEntry[]>();

/** A plugin's release notes from its CHANGELOG.md (built in at build time), newest first. */
export function pluginChangelog(pluginId: string): PluginChangelogEntry[] {
  let entries = parsed.get(pluginId);
  if (!entries) {
    entries = parseChangelog(pluginChangelogSources[pluginId] ?? '');
    parsed.set(pluginId, entries);
  }
  return entries;
}

import { parseChangelog, type PluginChangelogEntry } from '@devquake/plugin-sdk';
import { DEFAULT_LOCALE, type Locale } from '@devquake/ui';
import { pluginChangelogSources } from '@/plugins/registry.changelog.generated';

const parsed = new Map<string, PluginChangelogEntry[]>();

/**
 * A plugin's release notes (built in at build time), newest first, in the page language when
 * the plugin ships a CHANGELOG.<locale>.md, otherwise from its English CHANGELOG.md.
 */
export function pluginChangelog(
  pluginId: string,
  locale: Locale = DEFAULT_LOCALE,
): PluginChangelogEntry[] {
  const sources = pluginChangelogSources[pluginId] ?? {};
  const lang = sources[locale] ? locale : DEFAULT_LOCALE;
  const key = `${pluginId}:${lang}`;
  let entries = parsed.get(key);
  if (!entries) {
    entries = parseChangelog(sources[lang] ?? '');
    parsed.set(key, entries);
  }
  return entries;
}

import type { PluginManifest } from '@devquake/plugin-sdk';

/** Is this app path one of the plugin's public pages (ADR 0009)? Exact match, "/help/" too. */
export function isPublicPage(manifest: PluginManifest, path: string): boolean {
  const clean = path.length > 1 ? path.replace(/\/+$/, '') : path;
  return (manifest.publicPages ?? []).some((p) => p.path === clean);
}

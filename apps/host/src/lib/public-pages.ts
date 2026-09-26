import { matchRoute, type PluginManifest } from '@devquake/plugin-sdk';

/** Is this app path one of the plugin's public pages (ADR 0009)? Exact match, "/help/" too. */
export function isPublicPage(manifest: PluginManifest, path: string): boolean {
  const clean = path.length > 1 ? path.replace(/\/+$/, '') : path;
  return (manifest.publicPages ?? []).some((p) => p.path === clean);
}

/**
 * Is this app route open to every signed-in DevQuake user, even without access to the app
 * (ADR 0022)? `kind` picks the page or the API patterns of `manifest.signedInRoutes`.
 */
export function isSignedInRoute(
  manifest: PluginManifest,
  kind: 'pages' | 'api',
  path: string,
): boolean {
  const patterns = manifest.signedInRoutes?.[kind] ?? [];
  if (patterns.length === 0) return false;
  const clean = path.length > 1 ? path.replace(/\/+$/, '') : path;
  return matchRoute(patterns, clean) !== null;
}

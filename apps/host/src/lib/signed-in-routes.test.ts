import { describe, expect, it } from 'vitest';
import type { PluginManifest } from '@devquake/plugin-sdk';
import { isPublicPage, isSignedInRoute } from './public-pages';

const manifest: PluginManifest = {
  id: 'myvault',
  name: 'My vault',
  version: '0.1.0',
  publicPages: [{ path: '/help', title: 'Manual' }],
  signedInRoutes: { pages: ['/open/:id'], api: ['/open/:id', '/open/:id/attempt'] },
};

describe('routes open to signed-in members (ADR 0022)', () => {
  it('matches only the declared pages and API routes', () => {
    expect(isSignedInRoute(manifest, 'pages', '/open/12')).toBe(true);
    expect(isSignedInRoute(manifest, 'pages', '/open/12/')).toBe(true);
    expect(isSignedInRoute(manifest, 'pages', '/entries/12')).toBe(false);
    expect(isSignedInRoute(manifest, 'api', '/open/12/attempt')).toBe(true);
    expect(isSignedInRoute(manifest, 'api', '/entries')).toBe(false);
    expect(isSignedInRoute({ ...manifest, signedInRoutes: undefined }, 'pages', '/open/1')).toBe(
      false,
    );
    expect(isPublicPage(manifest, '/open/12')).toBe(false);
  });
});

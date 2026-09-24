import { describe, expect, it } from 'vitest';
import type { PluginManifest } from '@devquake/plugin-sdk';
import { contentGroup } from './content-group';
import { isPublicPage } from './public-pages';

describe('isPublicPage', () => {
  const manifest: PluginManifest = {
    id: 'shopping',
    name: 'Shopping',
    version: '1.0.0',
    publicPages: [{ path: '/help', title: 'User manual' }],
  };

  it('opens exactly the declared pages', () => {
    expect(isPublicPage(manifest, '/help')).toBe(true);
    expect(isPublicPage(manifest, '/help/')).toBe(true);
    expect(isPublicPage(manifest, '/')).toBe(false);
    expect(isPublicPage(manifest, '/help/secret')).toBe(false);
    expect(isPublicPage(manifest, '/helpme')).toBe(false);
    expect(isPublicPage({ ...manifest, publicPages: undefined }, '/help')).toBe(false);
  });
});

describe('contentGroup', () => {
  it('names the app a page belongs to', () => {
    expect(contentGroup('devquake.com', 'devquake.com')).toBe('site');
    expect(contentGroup('www.devquake.com', 'devquake.com')).toBe('site');
    expect(contentGroup('shopping.devquake.com', 'devquake.com')).toBe('shopping');
    expect(contentGroup('Shopping.DevQuake.com', 'devquake.com')).toBe('shopping');
    expect(contentGroup('shopping.lvh.me', 'lvh.me')).toBe('shopping');
    expect(contentGroup('evil.example', 'devquake.com')).toBe('site');
    expect(contentGroup("a'b.devquake.com", 'devquake.com')).toBe('site');
  });
});

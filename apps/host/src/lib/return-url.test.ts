import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { safeReturnUrl } from './return-url';

describe('safeReturnUrl', () => {
  const saved = process.env.ROOT_DOMAIN;
  beforeEach(() => {
    process.env.ROOT_DOMAIN = 'devquake.com';
  });
  afterEach(() => {
    process.env.ROOT_DOMAIN = saved;
  });

  it('accepts the site and its app subdomains', () => {
    expect(safeReturnUrl('https://shopping.devquake.com/lists/3')).toBe(
      'https://shopping.devquake.com/lists/3',
    );
    expect(safeReturnUrl('https://devquake.com/account')).toBe('https://devquake.com/account');
  });

  it('refuses everything else', () => {
    for (const bad of [
      'https://evil.com/',
      'https://devquake.com.evil.com/',
      'https://a.b.devquake.com/',
      'http://shopping.devquake.com/',
      'https://shopping.devquake.com:8443/',
      'https://user:pw@shopping.devquake.com/',
      'javascript:alert(1)',
      '//evil.com',
      '/account',
      '',
      null,
    ]) {
      expect(safeReturnUrl(bad)).toBeNull();
    }
  });

  it('matches protocol and port in local development', () => {
    process.env.ROOT_DOMAIN = 'lvh.me:3000';
    expect(safeReturnUrl('http://shopping.lvh.me:3000/')).toBe('http://shopping.lvh.me:3000/');
    expect(safeReturnUrl('http://shopping.lvh.me:4000/')).toBeNull();
  });
});

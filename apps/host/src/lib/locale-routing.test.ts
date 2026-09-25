import { describe, expect, it } from 'vitest';
import { createTranslator, localizePath, matchAcceptLanguage, stripLocale } from '@devquake/ui';
import { decideLocale, type LocaleRequest } from './locale-routing';

const page = (over: Partial<LocaleRequest> = {}): LocaleRequest => ({
  pathname: '/ideas',
  search: '',
  method: 'GET',
  cookie: undefined,
  acceptLanguage: null,
  isDocument: true,
  ...over,
});

describe('language in the URL', () => {
  it('strips and adds prefixes', () => {
    expect(stripLocale('/de/ideas/4')).toEqual({ locale: 'de', path: '/ideas/4' });
    expect(stripLocale('/hu')).toEqual({ locale: 'hu', path: '/' });
    expect(stripLocale('/design')).toEqual({ locale: null, path: '/design' });
    expect(localizePath('/ideas?sort=new', 'ro')).toBe('/ro/ideas?sort=new');
    expect(localizePath('/', 'de')).toBe('/de');
    expect(localizePath('/de/ideas', 'en')).toBe('/ideas');
    expect(localizePath('/api/lists', 'de')).toBe('/api/lists');
    expect(localizePath('/admin-cp/users', 'hu')).toBe('/admin-cp/users');
    expect(localizePath('https://devquake.com/x', 'de')).toBe('https://devquake.com/x');
  });

  it('picks the browser language when supported, English otherwise', () => {
    expect(matchAcceptLanguage('de-AT,de;q=0.9,en;q=0.8')).toBe('de');
    expect(matchAcceptLanguage('fr-FR,fr;q=0.9,hu;q=0.5')).toBe('hu');
    expect(matchAcceptLanguage('fr-FR,es;q=0.9')).toBe('en');
    expect(matchAcceptLanguage('en;q=0.5,ro;q=0.9')).toBe('ro');
    expect(matchAcceptLanguage(null)).toBe('en');
  });
});

describe('decideLocale', () => {
  it('serves prefixed pages in their language and remembers it', () => {
    expect(decideLocale(page({ pathname: '/de/ideas' }))).toEqual({
      kind: 'serve',
      locale: 'de',
      path: '/ideas',
      cookie: 'de',
    });
    expect(decideLocale(page({ pathname: '/de/ideas', cookie: 'de' }))).toMatchObject({
      cookie: undefined,
    });
  });

  it('sends a first visit to the browser language, but never crawlers or fetches', () => {
    expect(decideLocale(page({ acceptLanguage: 'ro-RO,ro' }))).toEqual({
      kind: 'redirect',
      location: '/ro/ideas',
      cookie: 'ro',
    });
    expect(decideLocale(page({ acceptLanguage: 'fr-FR' }))).toMatchObject({
      kind: 'serve',
      locale: 'en',
    });
    expect(decideLocale(page())).toMatchObject({ kind: 'serve', locale: 'en' });
    expect(decideLocale(page({ acceptLanguage: 'de', isDocument: false }))).toMatchObject({
      kind: 'serve',
      locale: 'en',
    });
  });

  it('follows the saved choice over the browser language', () => {
    expect(decideLocale(page({ cookie: 'en', acceptLanguage: 'de' }))).toMatchObject({
      kind: 'serve',
      locale: 'en',
    });
    expect(decideLocale(page({ cookie: 'hu', search: '?mine=1' }))).toEqual({
      kind: 'redirect',
      location: '/hu/ideas?mine=1',
      cookie: undefined,
    });
  });

  it('turns /en/... into the plain URL and keeps APIs and admin-cp unprefixed', () => {
    expect(decideLocale(page({ pathname: '/en/ideas', cookie: 'de' }))).toEqual({
      kind: 'redirect',
      location: '/ideas',
      cookie: 'en',
    });
    expect(decideLocale(page({ pathname: '/de/admin-cp/users' }))).toMatchObject({
      kind: 'redirect',
      location: '/admin-cp/users',
    });
    expect(decideLocale(page({ pathname: '/admin-cp', cookie: 'de' }))).toMatchObject({
      kind: 'serve',
      locale: 'en',
    });
    expect(
      decideLocale(page({ pathname: '/api/lists', cookie: 'ro', isDocument: false })),
    ).toMatchObject({ kind: 'serve', locale: 'ro', path: '/api/lists' });
  });
});

describe('createTranslator', () => {
  const en = { a: { hi: 'Hello {name}' }, items: { one: '{count} item', other: '{count} items' } };
  const ro = {
    a: { hi: 'Salut {name}' },
    items: { one: '{count} produs', few: '{count} produse', other: '{count} de produse' },
  };
  it('fills placeholders, picks plural forms per language and falls back to English', () => {
    const t = createTranslator('ro', ro, en);
    expect(t('a.hi', { name: 'Ana' })).toBe('Salut Ana');
    expect(t('items', { count: 1 })).toBe('1 produs');
    expect(t('items', { count: 3 })).toBe('3 produse');
    expect(t('items', { count: 20 })).toBe('20 de produse');
    expect(createTranslator('en', en)('items', { count: 2026 })).toBe('2026 items');
    expect(createTranslator('de', {}, en)('a.hi', { name: 'Bo' })).toBe('Hello Bo');
    expect(t('missing.key')).toBe('missing.key');
  });
});

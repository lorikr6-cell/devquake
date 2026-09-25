import { DEFAULT_LOCALE, LOCALES, localizePath, type Locale } from '@devquake/ui';

// Language versions of public pages for search engines (ADR 0011). Pure.

/** The absolute URL of `path` on `origin` in every language, plus x-default (English). */
export function languageUrls(origin: string, path: string): Record<Locale | 'x-default', string> {
  const urls = Object.fromEntries(
    LOCALES.map((l) => [l, `${origin}${localizePath(path, l)}`]),
  ) as Record<Locale, string>;
  return { ...urls, 'x-default': urls[DEFAULT_LOCALE] };
}

/** Next.js `alternates` for a public page: its canonical URL in `locale` and all versions. */
export function languageAlternates(origin: string, path: string, locale: Locale) {
  return {
    canonical: `${origin}${localizePath(path, locale)}`,
    languages: languageUrls(origin, path),
  };
}

/** `paths` in every language (for robots.txt rules). */
export function inEveryLanguage(paths: string[]): string[] {
  return paths.flatMap((p) => LOCALES.map((l) => localizePath(p, l)));
}

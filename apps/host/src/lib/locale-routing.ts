// How the proxy handles the language in the URL (ADR 0011). Pure, so it can be tested without
// Next.js: given the request, it says whether to redirect, which language the page is in and
// which path the router should see.

import {
  DEFAULT_LOCALE,
  isLocale,
  localizePath,
  matchAcceptLanguage,
  stripLocale,
  type Locale,
} from '@devquake/ui';

export interface LocaleRequest {
  pathname: string;
  search: string;
  method: string;
  /** Value of the dq_lang cookie. */
  cookie: string | undefined;
  acceptLanguage: string | null;
  /** A real page load: GET with Sec-Fetch-Dest "document" (not a client navigation or fetch). */
  isDocument: boolean;
}

export type LocaleDecision =
  /** Send the browser to `location`; remember `cookie` when set. */
  | { kind: 'redirect'; location: string; cookie?: Locale }
  /** Serve `path` (the URL without its language prefix) in `locale`; remember `cookie`. */
  | { kind: 'serve'; locale: Locale; path: string; cookie?: Locale };

// Paths that are never localized: APIs and the control panel (English, ADR 0011).
const NEUTRAL = /^\/(api|admin-cp)(\/|$)/;

export function decideLocale(req: LocaleRequest): LocaleDecision {
  const { locale: prefixed, path } = stripLocale(req.pathname);
  const saved = isLocale(req.cookie) ? req.cookie : null;

  // /de/admin-cp, /ro/api/...: these have no language versions.
  if (prefixed && NEUTRAL.test(path)) {
    return { kind: 'redirect', location: `${path}${req.search}` };
  }
  // /en/... is the English choice: remember it and use the plain URL.
  if (prefixed === DEFAULT_LOCALE) {
    return { kind: 'redirect', location: `${path}${req.search}`, cookie: DEFAULT_LOCALE };
  }
  if (prefixed) {
    return {
      kind: 'serve',
      locale: prefixed,
      path,
      cookie: saved === prefixed ? undefined : prefixed,
    };
  }

  // No prefix: English, unless the visitor's language is another one (their choice, or on a
  // first visit their browser's language). Only real page loads are redirected.
  const preferred = saved ?? matchAcceptLanguage(req.acceptLanguage);
  if (
    !NEUTRAL.test(path) &&
    preferred !== DEFAULT_LOCALE &&
    req.method === 'GET' &&
    req.isDocument
  ) {
    return {
      kind: 'redirect',
      location: `${localizePath(path, preferred)}${req.search}`,
      cookie: saved ? undefined : preferred,
    };
  }
  // An unprefixed page is English. APIs have no prefix of their own: they answer in the
  // visitor's language (the cookie, which every prefixed page visit keeps up to date).
  const isApi = path === '/api' || path.startsWith('/api/');
  return { kind: 'serve', locale: isApi ? (saved ?? DEFAULT_LOCALE) : DEFAULT_LOCALE, path };
}

import { NextResponse, type NextRequest } from 'next/server';
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from '@devquake/ui';
import { extractSubdomain, getRootHostname, sharedCookieDomain } from '@/lib/domain';
import { decideLocale } from '@/lib/locale-routing';
import { reservedSubdomains } from '@/plugins/registry.manifest.generated';

const INTERNAL_PREFIXES = ['/plugin-host', '/plugin-api'];
/** Host-only area that must only answer on the bare root domain (not www or other subdomains). */
const ROOT_ONLY_PREFIX = '/admin-cp';

function remember<T extends NextResponse>(response: T, locale: Locale | undefined): T {
  if (locale) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: 'lax',
      domain: sharedCookieDomain(),
    });
  }
  return response;
}

/**
 * Router for languages and subdomains.
 *   devquake.com/de/ideas       -> /ideas in German (ADR 0011: the prefix is stripped here and
 *                                  passed on as x-devquake-locale; English has no prefix)
 *   devquake.com/...            -> normal host routes (src/app/...)
 *   <id>.devquake.com/...       -> /plugin-host/<id>/...
 *   <id>.devquake.com/api/...   -> /plugin-api/<id>/...
 * The browser URL never changes (except for the language redirects); these are internal
 * rewrites. x-devquake-path is the path without the language, for language alternates.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Internal routes must never be reachable directly.
  if (INTERNAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return new NextResponse(null, { status: 404 });
  }

  const decision = decideLocale({
    pathname,
    search,
    method: request.method,
    cookie: request.cookies.get(LOCALE_COOKIE)?.value,
    acceptLanguage: request.headers.get('accept-language'),
    // A real page load (not a client-side navigation, prefetch, fetch or image).
    isDocument:
      request.headers.get('sec-fetch-dest') === 'document' &&
      !request.headers.has('rsc') &&
      !request.headers.has('next-router-prefetch'),
  });
  if (decision.kind === 'redirect') {
    return remember(
      NextResponse.redirect(new URL(decision.location, request.url), 307),
      decision.cookie,
    );
  }
  const path = decision.path;

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const sub = extractSubdomain(host);
  const hostname = host?.split(':')[0]?.toLowerCase();

  if (
    (path === ROOT_ONLY_PREFIX || path.startsWith(`${ROOT_ONLY_PREFIX}/`)) &&
    hostname !== getRootHostname()
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const headers = new Headers(request.headers);
  headers.set('x-devquake-locale', decision.locale);
  headers.set('x-devquake-path', path);

  if (!sub || (reservedSubdomains as readonly string[]).includes(sub)) {
    const response =
      path === pathname
        ? NextResponse.next({ request: { headers } })
        : NextResponse.rewrite(new URL(`${path}${search}`, request.url), { request: { headers } });
    return remember(response, decision.cookie);
  }

  const isApi = path === '/api' || path.startsWith('/api/');
  const target = isApi
    ? `/plugin-api/${sub}${path.slice('/api'.length)}`
    : `/plugin-host/${sub}${path === '/' ? '' : path}`;
  headers.set('x-devquake-plugin', sub);

  return remember(
    NextResponse.rewrite(new URL(`${target}${search}`, request.url), { request: { headers } }),
    decision.cookie,
  );
}

export const config = {
  // Skip Next internals and static files (anything with a file extension).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

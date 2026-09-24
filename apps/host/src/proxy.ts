import { NextResponse, type NextRequest } from 'next/server';
import { extractSubdomain, getRootHostname } from '@/lib/domain';
import { reservedSubdomains } from '@/plugins/registry.manifest.generated';

const INTERNAL_PREFIXES = ['/plugin-host', '/plugin-api'];
/** Host-only area that must only answer on the bare root domain (not www or other subdomains). */
const ROOT_ONLY_PREFIX = '/admin-cp';

/**
 * Subdomain router.
 *   devquake.com/...            -> normal host routes (src/app/...)
 *   <id>.devquake.com/...       -> /plugin-host/<id>/...
 *   <id>.devquake.com/api/...   -> /plugin-api/<id>/...
 * The browser URL never changes; this is an internal rewrite.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Internal routes must never be reachable directly.
  if (INTERNAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return new NextResponse(null, { status: 404 });
  }

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const sub = extractSubdomain(host);
  const hostname = host?.split(':')[0]?.toLowerCase();

  if (
    (pathname === ROOT_ONLY_PREFIX || pathname.startsWith(`${ROOT_ONLY_PREFIX}/`)) &&
    hostname !== getRootHostname()
  ) {
    return new NextResponse(null, { status: 404 });
  }

  if (!sub || (reservedSubdomains as readonly string[]).includes(sub)) {
    return NextResponse.next();
  }

  const isApi = pathname === '/api' || pathname.startsWith('/api/');
  const target = isApi
    ? `/plugin-api/${sub}${pathname.slice('/api'.length)}`
    : `/plugin-host/${sub}${pathname === '/' ? '' : pathname}`;

  const headers = new Headers(request.headers);
  headers.set('x-devquake-plugin', sub);
  // The app path as the visitor asked for it (always overwritten, so it cannot be spoofed):
  // the plugin layout uses it to let public pages (ADR 0009) through without a subscription.
  headers.set('x-devquake-path', isApi ? pathname.slice('/api'.length) || '/' : pathname);

  return NextResponse.rewrite(new URL(`${target}${search}`, request.url), {
    request: { headers },
  });
}

export const config = {
  // Skip Next internals and static files (anything with a file extension).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

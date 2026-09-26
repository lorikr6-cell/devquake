import { after } from 'next/server';
import { matchRoute, type HttpMethod } from '@devquake/plugin-sdk';
import { logActivity } from '@/lib/activity';
import { pluginUrl } from '@/lib/domain';
import { extendSession, getSessionUser } from '@/lib/auth/session';
import { appAccess, buildPluginContext, isPluginOnline, loadPlugin } from '@/lib/plugins';
import { maybeRunScheduled } from '@/lib/plugin-scheduler';
import { getT } from '@/i18n/server';

/** A sign-in in use that ends sooner than this is extended. */
const EXTEND_BELOW_MS = 2 * 60 * 60_000;

type RouteContext = { params: Promise<{ plugin: string; path?: string[] }> };

const json = (status: number, body: unknown, headers?: HeadersInit) =>
  Response.json(body, { status, headers });

async function dispatch(request: Request, context: RouteContext, method: HttpMethod) {
  const { plugin: id, path = [] } = await context.params;
  // Messages the app may show: in the visitor's language (ADR 0011).
  const t = await getT('common.api');
  const plugin = await loadPlugin(id);
  if (!plugin?.api || !(await isPluginOnline(id))) return json(404, { error: t('notFound') });
  // The apps' scheduled work (monthly emails...) runs from traffic: there is no cron (ADR 0014).
  after(() => maybeRunScheduled());
  // CSRF: writes must come from the app's own pages (same origin), never from other sites.
  if (method !== 'GET' && method !== 'HEAD') {
    const origin = request.headers.get('origin');
    if (origin && origin !== pluginUrl(id)) {
      return json(403, { error: t('crossSite') });
    }
  }
  const access = await appAccess(id);
  if (!access.ok) {
    if (access.reason === 'unavailable') return json(503, { error: t('busy') });
    return access.reason === 'signin'
      ? json(401, { error: t('signIn') })
      : json(403, { error: t('subscribe') });
  }

  // Active use keeps the sign-in going (ADR 0014): looking the session up already keeps it from
  // going idle; when it would end within two hours it is extended (at most 24 h after sign-in).
  const user = await getSessionUser().catch(() => null);
  let expiresAt = user?.expiresAt ?? null;
  if (user && user.expiresAt.getTime() - Date.now() < EXTEND_BELOW_MS) {
    expiresAt = (await extendSession(user.sessionId, 3).catch(() => null)) ?? expiresAt;
  }
  // Reserved for the host's activity ping (components/app-activity-keepalive.tsx).
  if (path.length === 1 && path[0] === '_active') {
    return method === 'POST' ? json(200, { expiresAt }) : json(405, { error: t('method') });
  }

  const match = matchRoute(Object.keys(plugin.api), `/${path.join('/')}`);
  if (!match) return json(404, { error: t('notFound') });

  const mod = await plugin.api[match.pattern]!();
  const handler = mod[method];
  if (!handler) {
    return json(405, { error: t('method') }, { Allow: Object.keys(mod).join(', ') });
  }
  try {
    return await handler(request, {
      params: match.params,
      ctx: await buildPluginContext(plugin.manifest),
    });
  } catch (err) {
    // Unhandled plugin errors land in the site-wide activity log under the plugin's id.
    console.error(`[plugin-api] ${id} ${method} ${match.pattern}`, err);
    await logActivity({
      source: id,
      level: 'error',
      action: 'api.unhandled_error',
      message: err instanceof Error ? err.message : String(err),
      requestPath: `/api/${path.join('/')}`,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: request.headers.get('user-agent')?.slice(0, 512) ?? null,
      metadata: { method, pattern: match.pattern },
    });
    return json(500, { error: t('internal') });
  }
}

export const GET = (r: Request, c: RouteContext) => dispatch(r, c, 'GET');
export const POST = (r: Request, c: RouteContext) => dispatch(r, c, 'POST');
export const PUT = (r: Request, c: RouteContext) => dispatch(r, c, 'PUT');
export const PATCH = (r: Request, c: RouteContext) => dispatch(r, c, 'PATCH');
export const DELETE = (r: Request, c: RouteContext) => dispatch(r, c, 'DELETE');

import { matchRoute, type HttpMethod } from '@devquake/plugin-sdk';
import { logActivity } from '@/lib/activity';
import { buildPluginContext, loadPlugin } from '@/lib/plugins';

type RouteContext = { params: Promise<{ plugin: string; path?: string[] }> };

const json = (status: number, body: unknown, headers?: HeadersInit) =>
  Response.json(body, { status, headers });

async function dispatch(request: Request, context: RouteContext, method: HttpMethod) {
  const { plugin: id, path = [] } = await context.params;
  const plugin = await loadPlugin(id);
  if (!plugin?.api) return json(404, { error: 'Not found' });

  const match = matchRoute(Object.keys(plugin.api), `/${path.join('/')}`);
  if (!match) return json(404, { error: 'Not found' });

  const mod = await plugin.api[match.pattern]!();
  const handler = mod[method];
  if (!handler) {
    return json(405, { error: 'Method not allowed' }, { Allow: Object.keys(mod).join(', ') });
  }
  try {
    return await handler(request, {
      params: match.params,
      ctx: buildPluginContext(plugin.manifest),
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
    return json(500, { error: 'Internal server error' });
  }
}

export const GET = (r: Request, c: RouteContext) => dispatch(r, c, 'GET');
export const POST = (r: Request, c: RouteContext) => dispatch(r, c, 'POST');
export const PUT = (r: Request, c: RouteContext) => dispatch(r, c, 'PUT');
export const PATCH = (r: Request, c: RouteContext) => dispatch(r, c, 'PATCH');
export const DELETE = (r: Request, c: RouteContext) => dispatch(r, c, 'DELETE');

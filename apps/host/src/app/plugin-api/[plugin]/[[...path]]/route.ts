import { matchRoute, type HttpMethod } from '@devquake/plugin-sdk';
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
  return handler(request, { params: match.params, ctx: buildPluginContext(plugin.manifest) });
}

export const GET = (r: Request, c: RouteContext) => dispatch(r, c, 'GET');
export const POST = (r: Request, c: RouteContext) => dispatch(r, c, 'POST');
export const PUT = (r: Request, c: RouteContext) => dispatch(r, c, 'PUT');
export const PATCH = (r: Request, c: RouteContext) => dispatch(r, c, 'PATCH');
export const DELETE = (r: Request, c: RouteContext) => dispatch(r, c, 'DELETE');

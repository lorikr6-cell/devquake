import type {
  PluginApiArgs,
  PluginApiHandler,
  PluginDatabase,
  PluginPeople,
  PluginUser,
} from '@devquake/plugin-sdk';
import { HttpError } from './http';

export interface ApiScope {
  request: Request;
  params: Record<string, string>;
  db: PluginDatabase;
  user: PluginUser;
  people: PluginPeople | undefined;
}

/**
 * Wraps an API handler: requires a signed-in user and the plugin database, turns HttpError into
 * JSON errors and plain return values into JSON responses (undefined → 204).
 */
export function api(fn: (scope: ApiScope) => Promise<unknown>): PluginApiHandler {
  return async (request: Request, { params, ctx }: PluginApiArgs) => {
    if (!ctx.user) return Response.json({ error: 'Please sign in on DevQuake' }, { status: 401 });
    if (!ctx.db) {
      return Response.json(
        { error: 'Shopping lists are not available right now' },
        { status: 503 },
      );
    }
    try {
      const result = await fn({ request, params, db: ctx.db, user: ctx.user, people: ctx.people });
      if (result instanceof Response) return result;
      if (result === undefined) return new Response(null, { status: 204 });
      return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
    } catch (err) {
      if (err instanceof HttpError) {
        return Response.json({ error: err.message }, { status: err.status });
      }
      throw err; // the host logs it and answers 500
    }
  };
}

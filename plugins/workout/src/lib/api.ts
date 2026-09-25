import type {
  PluginApiArgs,
  PluginApiHandler,
  PluginDatabase,
  PluginSession,
  PluginUser,
} from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { HttpError } from './http';

export interface ApiScope {
  request: Request;
  params: Record<string, string>;
  db: PluginDatabase;
  user: PluginUser;
  /** The sign-in session (ADR 0014); undefined on hosts without it. */
  session: PluginSession | null | undefined;
}

/**
 * Wraps an API handler: requires a signed-in user and the plugin database, turns HttpError into
 * JSON errors in the visitor's language and plain return values into JSON (undefined → 204).
 */
export function api(fn: (scope: ApiScope) => Promise<unknown>): PluginApiHandler {
  return async (request: Request, { params, ctx }: PluginApiArgs) => {
    const t = translator(localeOf(ctx));
    if (!ctx.user) return Response.json({ error: t('errors.signIn') }, { status: 401 });
    if (!ctx.db) return Response.json({ error: t('errors.unavailable') }, { status: 503 });
    try {
      const result = await fn({
        request,
        params,
        db: ctx.db,
        user: ctx.user,
        session: ctx.session,
      });
      if (result instanceof Response) return result;
      if (result === undefined) return new Response(null, { status: 204 });
      return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
    } catch (err) {
      if (err instanceof HttpError) {
        const { field, template, ...rest } = err.params;
        const values: Record<string, string | number> =
          field === undefined ? rest : { ...rest, field: t(`fields.${field}`) };
        // A suggested routine is named by its template, in the visitor's language.
        if (template !== undefined && !values.routine) values.routine = t(`templates.${template}`);
        return Response.json({ error: t(`errors.${err.key}`, values) }, { status: err.status });
      }
      throw err; // the host logs it and answers 500
    }
  };
}

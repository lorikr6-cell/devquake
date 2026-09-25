import type { PluginApiHandler } from '@devquake/plugin-sdk';

/**
 * Available at https://workout.devquake.com/api/health. `database` tells whether the app's own
 * database is reachable: "ok", "not-configured" (WORKOUT_DB_* missing) or "error".
 */
export const GET: PluginApiHandler = async (_request, { ctx }) => {
  let database: 'ok' | 'not-configured' | 'error' = 'not-configured';
  if (ctx.db) {
    try {
      await ctx.db.query('SELECT 1 FROM schema_migrations LIMIT 1');
      database = 'ok';
    } catch (err) {
      console.error('[workout] database check failed', err);
      database = 'error';
    }
  }
  return Response.json({
    ok: true,
    plugin: ctx.pluginId,
    database,
    time: new Date().toISOString(),
  });
};

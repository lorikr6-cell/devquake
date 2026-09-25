import type { PluginPlatformModule } from '@devquake/plugin-sdk';

/** Hooks the platform calls (ADR 0007): dashboard numbers. */

export const getStats: PluginPlatformModule['getStats'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{ migrations: number }>(
    'SELECT COUNT(*) AS migrations FROM schema_migrations',
  );
  return [{ label: 'Database migrations applied', value: Number(row?.migrations ?? 0) }];
};

// deleteUserData: not needed yet, the app stores no user data. Add it together with the first
// table that has a user id (it runs on account deletion AND on unsubscribing).

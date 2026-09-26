import { getLocale } from '@/i18n/server';
import { cache } from 'react';
import type { PluginContext, PluginDefinition, PluginManifest } from '@devquake/plugin-sdk';
import { pluginLoaders } from '@/plugins/registry.generated';
import { logActivity } from './activity';
import { queryOne, type Row } from './db';
import { extendSession, getSessionUser } from './auth/session';
import { getRootDomain, hostUrl, pluginUrl, sessionSharedWithApps } from './domain';
import { pluginChangelog } from './plugin-changelog';
import { pluginDatabase } from './plugin-db';
import { referralNetwork } from './referrals';
import { getTimeZone } from './timezone-server';
import { rememberLocale } from './user-locale';
import { appIdentity } from './app-icons';
import { canUseProjectApp, projectForPlugin } from './subscriptions';
import { missingPoints, subscriptionCost } from './nps-rules';
import { getNps } from './referrals';
import { getTrials } from './trials';
import { canStartTrial, trialState } from './trial-rules';

/** Load a plugin by id (cached per request). Returns null if unknown or disabled. */
export const loadPlugin = cache(async (id: string): Promise<PluginDefinition | null> => {
  const loader = pluginLoaders[id];
  if (!loader) return null;
  const plugin = await loader();
  if (plugin.manifest.status === 'disabled') return null;
  return plugin;
});

/**
 * Everything a plugin page, layout or API handler gets from the host (ADR 0007): its URLs, the
 * signed-in user (minimal fields, no email), their referral network and, if it declared one,
 * its own database.
 * Cached per request.
 */
export const buildPluginContext = cache(
  async (manifest: PluginManifest): Promise<PluginContext> => {
    const session = await getSessionUser().catch(() => null);
    const locale = await getLocale();
    const identity = await appIdentity(manifest.id, manifest.name);
    if (session) rememberLocale(session.userId, locale);
    return {
      pluginId: manifest.id,
      rootDomain: getRootDomain(),
      baseUrl: pluginUrl(manifest.id),
      hostUrl: hostUrl(),
      user: session
        ? { id: session.userId, displayName: session.displayName, isAdmin: session.isAdmin }
        : null,
      db: manifest.database ? pluginDatabase(manifest.id) : undefined,
      people:
        session && process.env.MAIN_DB_NAME
          ? { referrals: () => referralNetwork(session.userId, manifest.id) }
          : undefined,
      changelog: pluginChangelog(manifest.id, locale),
      app: { name: identity.name, iconUrl: identity.iconUrl },
      timeZone: await getTimeZone(),
      locale,
      session: session
        ? {
            expiresAt: session.expiresAt.toISOString(),
            extend: async (hours = 3) => {
              const end = await extendSession(session.sessionId, hours);
              return (end ?? session.expiresAt).toISOString();
            },
          }
        : null,
    };
  },
);

/**
 * An app may only be visited once an admin has put its project online (and public) in
 * /admin-cp/projects.
 * Local development without a database (no MAIN_DB_NAME) allows every plugin; any database
 * error keeps the app closed.
 */
export const isPluginOnline = cache(async (id: string): Promise<boolean> => {
  if (!process.env.MAIN_DB_NAME) return true;
  try {
    const row = await queryOne<Row & { is_online: number }>(
      `SELECT (is_online = 1 AND is_public = 1) AS is_online FROM projects
        WHERE plugin_id = ? AND status <> 'archived'
        ORDER BY is_online DESC, is_public DESC LIMIT 1`,
      [id],
    );
    return row?.is_online === 1;
  } catch (err) {
    console.error('[plugins] online check failed', err);
    return false;
  }
});

export type AppAccess =
  | { ok: true; trialEndsAt?: Date }
  | {
      ok: false;
      /** 'unavailable': the sign-in could not be checked (database error), not a sign-out. */
      reason: 'signin' | 'subscribe' | 'trial-ended' | 'unavailable';
      projectName: string;
      projectId?: number;
      /** The member may still start their one 24-hour trial (ADR 0016). */
      canTry?: boolean;
      /** NPS points subscribing costs this member (ADR 0012), and how many they still lack. */
      cost?: number;
      missing?: number;
    };

/**
 * Who may use an online app (ADR 0006): its subscribers, users the owner assigned to the
 * project, admins, and members during their 24-hour trial (ADR 0016). Local development
 * without a database, or on plain "localhost" (where the session cannot be shared with
 * subdomains), allows everyone. Cached per request.
 */
export const appAccess = cache(async (id: string): Promise<AppAccess> => {
  if (!process.env.MAIN_DB_NAME || !sessionSharedWithApps()) return { ok: true };
  const project = await projectForPlugin(id);
  if (!project) return { ok: false, reason: 'signin', projectName: id };
  // A failed lookup (e.g. too many database connections) is not a sign-out: saying "sign in"
  // there sent signed-in members to the sign-in page. It is logged to find such moments.
  let user: Awaited<ReturnType<typeof getSessionUser>>;
  try {
    user = await getSessionUser();
  } catch (err) {
    console.error('[plugins] session lookup failed', err);
    await logActivity({
      source: id,
      level: 'error',
      action: 'auth.session.lookup_failed',
      message: err instanceof Error ? err.message.slice(0, 500) : String(err),
    }).catch(() => {});
    return { ok: false, reason: 'unavailable', projectName: project.name };
  }
  if (!user) return { ok: false, reason: 'signin', projectName: project.name };
  if (await canUseProjectApp(user, project.id)) return { ok: true };
  const trial = (await getTrials(user.userId)).get(project.id);
  const state = trialState(trial, new Date());
  if (state.kind === 'active') return { ok: true, trialEndsAt: state.endsAt };
  const cost = subscriptionCost(Number(project.nps_cost ?? 0), {
    isAdmin: user.isAdmin,
    assigned: false,
  });
  return {
    ok: false,
    reason: state.kind === 'ended' ? 'trial-ended' : 'subscribe',
    projectName: project.name,
    projectId: project.id,
    canTry: canStartTrial({ appOnline: true, isAdmin: user.isAdmin, member: false, trial }),
    cost,
    missing: missingPoints(cost > 0 ? await getNps(user.userId) : 0, cost),
  };
});

export { isPublicPage, isSignedInRoute } from './public-pages';

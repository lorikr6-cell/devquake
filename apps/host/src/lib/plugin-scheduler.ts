import 'server-only';
import { pluginLoaders } from '@/plugins/registry.generated';
import { logActivity } from './activity';
import { pluginUrl } from './domain';
import { pluginDatabase } from './plugin-db';
import { lastActiveAt } from './last-activity';
import { pluginMailer } from './plugin-mail';

/**
 * Runs the apps' `scheduled` hooks (ADR 0014). Managed hosting has no cron, so this runs from
 * app traffic (after the response is sent) and from /api/scheduled, at most once every five
 * minutes per server process (often enough for workout reminders, ADR 0019). Hooks must be
 * idempotent. Never throws; a failing app is logged and the others still run.
 */
const RUN_EVERY_MS = 5 * 60 * 1000;
const globalForScheduler = globalThis as unknown as { devquakeScheduledAt?: number };

export async function maybeRunScheduled(force = false): Promise<string[]> {
  const now = Date.now();
  if (!force && now - (globalForScheduler.devquakeScheduledAt ?? 0) < RUN_EVERY_MS) return [];
  globalForScheduler.devquakeScheduledAt = now;
  if (!process.env.MAIN_DB_NAME) return [];

  const ran: string[] = [];
  for (const [id, load] of Object.entries(pluginLoaders)) {
    try {
      const plugin = await load();
      if (plugin.manifest.status === 'disabled' || !plugin.platform) continue;
      const mod = await plugin.platform();
      if (!mod.scheduled) continue;
      await mod.scheduled({
        pluginId: id,
        db: plugin.manifest.database ? pluginDatabase(id) : undefined,
        baseUrl: pluginUrl(id),
        now: new Date(now),
        mail: pluginMailer(id, plugin.manifest.mailWithoutAccess === true),
        lastActiveAt,
      });
      ran.push(id);
    } catch (err) {
      console.error(`[scheduled] ${id} failed`, err);
      await logActivity({
        source: id,
        level: 'error',
        action: 'scheduled.failed',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return ran;
}

import 'server-only';
import { randomBytes } from 'node:crypto';
import { sha256 } from './auth/codes';
import { parseUserAgent } from './auth/user-agent';
import { execute, query, queryOne, type Row } from './db';
import type { RequestInfo } from './request';

/**
 * Cookie-free visitor counting (no consent needed): a visitor is SHA-256(daily salt + IP +
 * user agent). The salt is random per day and deleted the next day together with the day's
 * hashes, so nothing stored can be linked back to a person; only daily totals remain.
 */
async function todaysSalt(): Promise<string> {
  const existing = await queryOne<Row & { salt: string }>(
    'SELECT salt FROM visit_salts WHERE day = UTC_DATE()',
  );
  if (existing) return existing.salt;
  await execute('INSERT IGNORE INTO visit_salts (day, salt) VALUES (UTC_DATE(), ?)', [
    randomBytes(32).toString('hex'),
  ]);
  // Forget earlier salts and hashes as soon as a new day starts.
  await execute('DELETE FROM visit_salts WHERE day < UTC_DATE()');
  await execute('DELETE FROM site_visitors_daily WHERE day < UTC_DATE()');
  const row = await queryOne<Row & { salt: string }>(
    'SELECT salt FROM visit_salts WHERE day = UTC_DATE()',
  );
  return row!.salt;
}

/** Counts one page view (and a new unique visitor, once per day). Never throws. */
export async function recordVisit(info: RequestInfo): Promise<void> {
  try {
    if (!info.ip || parseUserAgent(info.userAgent).deviceType === 'bot') return;
    const hash = sha256(`${await todaysSalt()}|${info.ip}|${info.userAgent ?? ''}`);
    const inserted = await execute(
      'INSERT IGNORE INTO site_visitors_daily (day, visitor_hash) VALUES (UTC_DATE(), ?)',
      [hash],
    );
    const isNew = inserted.affectedRows === 1 ? 1 : 0;
    await execute(
      `INSERT INTO site_stats_daily (day, page_views, visitors) VALUES (UTC_DATE(), 1, ?)
       ON DUPLICATE KEY UPDATE page_views = page_views + 1, visitors = visitors + VALUES(visitors)`,
      [isNew],
    );
  } catch (err) {
    console.error('[visits] failed to record', err);
  }
}

export interface PublicStats {
  visitorsToday: number;
  visitors30: number;
  visitorsTotal: number;
  pageViewsTotal: number;
  accounts: number;
  activeAccounts30: number;
  projects: number;
  projectsOnline: number;
  ideasDone: number;
  ideasTotal: number;
  daily: Array<{ day: string; visitors: number }>;
}

/** Aggregate numbers for the public landing page (public projects/ideas only). */
export async function getPublicStats(days = 30): Promise<PublicStats> {
  const [totals, daily] = await Promise.all([
    queryOne<Row & Record<string, string | number | null>>(
      `SELECT
         (SELECT COALESCE(SUM(visitors), 0) FROM site_stats_daily WHERE day = UTC_DATE()) AS visitorsToday,
         (SELECT COALESCE(SUM(visitors), 0) FROM site_stats_daily WHERE day > UTC_DATE() - INTERVAL ? DAY) AS visitors30,
         (SELECT COALESCE(SUM(visitors), 0) FROM site_stats_daily) AS visitorsTotal,
         (SELECT COALESCE(SUM(page_views), 0) FROM site_stats_daily) AS pageViewsTotal,
         (SELECT COUNT(*) FROM users WHERE status = 'active') AS accounts,
         (SELECT COUNT(*) FROM users WHERE status = 'active'
             AND last_login_at > UTC_TIMESTAMP() - INTERVAL 30 DAY) AS activeAccounts30,
         (SELECT COUNT(*) FROM projects WHERE status <> 'archived' AND is_public = 1) AS projects,
         (SELECT COUNT(*) FROM projects WHERE status <> 'archived' AND is_public = 1
             AND is_online = 1 AND plugin_id IS NOT NULL) AS projectsOnline,
         (SELECT COUNT(*) FROM ideas i JOIN projects p ON p.id = i.project_id
           WHERE i.is_public = 1 AND p.is_public = 1 AND p.status <> 'archived'
             AND i.status = 'done') AS ideasDone,
         (SELECT COUNT(*) FROM ideas i JOIN projects p ON p.id = i.project_id
           WHERE i.is_public = 1 AND p.is_public = 1 AND p.status <> 'archived'
             AND i.status <> 'dropped') AS ideasTotal`,
      [days],
    ),
    query<Row & { day: string; visitors: number }>(
      `SELECT DATE_FORMAT(day, '%Y-%m-%d') AS day, visitors FROM site_stats_daily
        WHERE day > UTC_DATE() - INTERVAL ? DAY`,
      [days],
    ),
  ]);
  const n = (k: string) => Number(totals?.[k] ?? 0);
  const byDay = new Map(daily.map((r) => [r.day, Number(r.visitors)]));
  const series: PublicStats['daily'] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i))
      .toISOString()
      .slice(0, 10);
    series.push({ day: key, visitors: byDay.get(key) ?? 0 });
  }
  return {
    visitorsToday: n('visitorsToday'),
    visitors30: n('visitors30'),
    visitorsTotal: n('visitorsTotal'),
    pageViewsTotal: n('pageViewsTotal'),
    accounts: n('accounts'),
    activeAccounts30: n('activeAccounts30'),
    projects: n('projects'),
    projectsOnline: n('projectsOnline'),
    ideasDone: n('ideasDone'),
    ideasTotal: n('ideasTotal'),
    daily: series,
  };
}

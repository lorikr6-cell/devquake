import 'server-only';
import { query, queryOne, type Row } from '../db';

export const ACTIVITY_LEVELS = ['debug', 'info', 'notice', 'warning', 'error', 'security'] as const;

export interface ActivityRow extends Row {
  id: number;
  occurred_at: Date;
  source: string;
  level: (typeof ACTIVITY_LEVELS)[number];
  action: string;
  message: string | null;
  actor_user_id: number | null;
  actor_name: string | null;
  entity_type: string | null;
  entity_id: string | null;
  ip: string | null;
  request_path: string | null;
}

export interface ActivityFilter {
  source?: string;
  level?: string;
  action?: string;
  page?: number;
}

export const ACTIVITY_PAGE_SIZE = 50;

function buildWhere(filter: ActivityFilter) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.source) {
    where.push('a.source = ?');
    params.push(filter.source);
  }
  if (filter.level && (ACTIVITY_LEVELS as readonly string[]).includes(filter.level)) {
    where.push('a.level = ?');
    params.push(filter.level);
  }
  if (filter.action) {
    where.push('a.action LIKE ?');
    params.push(`${filter.action.replace(/[\\%_]/g, '\\$&')}%`);
  }
  return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

export async function listActivity(filter: ActivityFilter = {}, limit = ACTIVITY_PAGE_SIZE) {
  const { sql, params } = buildWhere(filter);
  const offset = Math.max(0, (filter.page ?? 1) - 1) * limit;
  const [rows, total] = await Promise.all([
    query<ActivityRow>(
      `SELECT a.*, u.display_name AS actor_name
         FROM activity_log a LEFT JOIN users u ON u.id = a.actor_user_id
         ${sql}
        ORDER BY a.occurred_at DESC, a.id DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    ),
    queryOne<Row & { n: number }>(`SELECT COUNT(*) AS n FROM activity_log a ${sql}`, params),
  ]);
  return { rows, total: Number(total?.n ?? 0) };
}

export async function listActivitySources(): Promise<string[]> {
  const rows = await query<Row & { source: string }>(
    'SELECT DISTINCT source FROM activity_log ORDER BY source',
  );
  return rows.map((r) => r.source);
}

export async function countSecurityEvents(hours = 24): Promise<number> {
  const row = await queryOne<Row & { n: number }>(
    `SELECT COUNT(*) AS n FROM activity_log
      WHERE level = 'security' AND action <> 'auth.login.success' AND action <> 'auth.logout'
        AND occurred_at > UTC_TIMESTAMP() - INTERVAL ? HOUR`,
    [hours],
  );
  return Number(row?.n ?? 0);
}

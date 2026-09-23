import 'server-only';
import { query, queryOne, type Row } from '../db';

export const PROJECT_ROLES = ['viewer', 'member', 'manager'] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

export interface UserListRow extends Row {
  id: number;
  email: string;
  display_name: string;
  status: 'active' | 'disabled' | 'pending';
  rating: number | null;
  created_at: Date;
  last_login_at: Date | null;
  locked: number;
  role_codes: string | null;
  project_count: number;
  last_country: string | null;
  last_city: string | null;
}

export function listUsers(filter: { q?: string; status?: string; role?: string } = {}) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.q) {
    where.push('(u.email LIKE ? OR u.display_name LIKE ?)');
    const like = `%${filter.q.replace(/[\\%_]/g, '\\$&')}%`;
    params.push(like, like);
  }
  if (filter.status && ['active', 'disabled', 'pending'].includes(filter.status)) {
    where.push('u.status = ?');
    params.push(filter.status);
  }
  if (filter.role) {
    where.push(
      'EXISTS (SELECT 1 FROM user_roles x JOIN roles xr ON xr.id = x.role_id WHERE x.user_id = u.id AND xr.code = ?)',
    );
    params.push(filter.role);
  }
  return query<UserListRow>(
    `SELECT u.id, u.email, u.display_name, u.status, u.rating, u.created_at, u.last_login_at,
            (u.locked_until IS NOT NULL AND u.locked_until > UTC_TIMESTAMP()) AS locked,
            (SELECT GROUP_CONCAT(r.code ORDER BY r.code SEPARATOR ',')
               FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id) AS role_codes,
            (SELECT COUNT(*) FROM user_projects up WHERE up.user_id = u.id) AS project_count,
            (SELECT s.country FROM auth_snapshots s WHERE s.user_id = u.id AND s.country IS NOT NULL
              ORDER BY s.occurred_at DESC LIMIT 1) AS last_country,
            (SELECT s.city FROM auth_snapshots s WHERE s.user_id = u.id AND s.country IS NOT NULL
              ORDER BY s.occurred_at DESC LIMIT 1) AS last_city
       FROM users u
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY u.created_at DESC
      LIMIT 500`,
    params,
  );
}

export interface UserDetailRow extends Row {
  id: number;
  email: string;
  display_name: string;
  status: 'active' | 'disabled' | 'pending';
  rating: number | null;
  email_verified_at: Date | null;
  created_at: Date;
  last_login_at: Date | null;
  last_login_ip: string | null;
  locked_until: Date | null;
  locked: number;
  active_sessions: number;
}

export function getUser(id: number) {
  return queryOne<UserDetailRow>(
    `SELECT u.id, u.email, u.display_name, u.status, u.rating, u.email_verified_at, u.created_at,
            u.last_login_at, u.last_login_ip, u.locked_until,
            (u.locked_until IS NOT NULL AND u.locked_until > UTC_TIMESTAMP()) AS locked,
            (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id AND s.revoked_at IS NULL
                AND s.expires_at > UTC_TIMESTAMP()) AS active_sessions
       FROM users u WHERE u.id = ?`,
    [id],
  );
}

export interface RoleRow extends Row {
  id: number;
  code: string;
  scope: string;
  name: string;
  description: string | null;
}

export function listRoles() {
  return query<RoleRow>(
    "SELECT id, code, scope, name, description FROM roles ORDER BY scope = 'platform' DESC, scope, name",
  );
}

export async function getUserRoleCodes(userId: number): Promise<string[]> {
  const rows = await query<Row & { code: string }>(
    'SELECT r.code FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?',
    [userId],
  );
  return rows.map((r) => r.code);
}

export interface UserProjectRow extends Row {
  project_id: number;
  project_role: ProjectRole;
  name: string;
  plugin_id: string | null;
}

export function getUserProjects(userId: number) {
  return query<UserProjectRow>(
    `SELECT up.project_id, up.project_role, p.name, p.plugin_id
       FROM user_projects up JOIN projects p ON p.id = up.project_id
      WHERE up.user_id = ? ORDER BY p.sort_order, p.name`,
    [userId],
  );
}

export interface SnapshotRow extends Row {
  id: number;
  occurred_at: Date;
  event: string;
  outcome: string;
  context: string;
  email: string | null;
  user_id: number | null;
  ip: string | null;
  country_code: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  isp: string | null;
  is_proxy: number | null;
  proxy_type: string | null;
  vpn_operator: string | null;
  browser: string | null;
  browser_version: string | null;
  os: string | null;
  device_type: string | null;
  client_timezone: string | null;
  ip_timezone: string | null;
  timezone_mismatch: number | null;
  screen: string | null;
}

export function listSnapshots(
  filter: { userId?: number; limit?: number; failedOnly?: boolean } = {},
) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.userId) {
    where.push('user_id = ?');
    params.push(filter.userId);
  }
  if (filter.failedOnly) where.push("outcome NOT IN ('ok', 'code_sent')");
  return query<SnapshotRow>(
    `SELECT * FROM auth_snapshots ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY occurred_at DESC, id DESC LIMIT ?`,
    [...params, filter.limit ?? 50],
  );
}

// ---------------------------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------------------------

export interface UserTotals {
  total: number;
  active: number;
  pending: number;
  disabled: number;
  locked: number;
  admins: number;
  newLast30: number;
  activeLast30: number;
  onlineSessions: number;
}

export async function getUserTotals(): Promise<UserTotals> {
  const row = await queryOne<Row & Record<keyof UserTotals, number | string>>(
    `SELECT COUNT(*) AS total,
            SUM(status = 'active') AS active,
            SUM(status = 'pending') AS pending,
            SUM(status = 'disabled') AS disabled,
            SUM(locked_until IS NOT NULL AND locked_until > UTC_TIMESTAMP()) AS locked,
            (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON r.id = ur.role_id
              WHERE r.code IN ('platform.admin', 'platform.owner')) AS admins,
            SUM(created_at > UTC_TIMESTAMP() - INTERVAL 30 DAY) AS newLast30,
            SUM(last_login_at > UTC_TIMESTAMP() - INTERVAL 30 DAY) AS activeLast30,
            (SELECT COUNT(DISTINCT s.user_id) FROM sessions s WHERE s.revoked_at IS NULL
                AND s.expires_at > UTC_TIMESTAMP()
                AND s.last_seen_at > UTC_TIMESTAMP() - INTERVAL 15 MINUTE) AS onlineSessions
       FROM users`,
  );
  const n = (k: keyof UserTotals) => Number(row?.[k] ?? 0);
  return {
    total: n('total'),
    active: n('active'),
    pending: n('pending'),
    disabled: n('disabled'),
    locked: n('locked'),
    admins: n('admins'),
    newLast30: n('newLast30'),
    activeLast30: n('activeLast30'),
    onlineSessions: n('onlineSessions'),
  };
}

export interface DailyRow {
  day: string;
  signups: number;
  signins: number;
  failed: number;
}

/** Per UTC day for the last `days` days, including days without events. */
export async function getDailyAuthActivity(days = 30): Promise<DailyRow[]> {
  const [auth, signups] = await Promise.all([
    query<Row & { day: string; signins: string; failed: string }>(
      `SELECT DATE_FORMAT(occurred_at, '%Y-%m-%d') AS day,
              SUM(event = 'verify' AND outcome = 'ok') AS signins,
              SUM(outcome NOT IN ('ok', 'code_sent')) AS failed
         FROM auth_snapshots
        WHERE occurred_at >= UTC_DATE() - INTERVAL ? DAY
        GROUP BY day`,
      [days - 1],
    ),
    // Completed sign-ups = email confirmed with the code.
    query<Row & { day: string; n: number }>(
      `SELECT DATE_FORMAT(email_verified_at, '%Y-%m-%d') AS day, COUNT(*) AS n
         FROM users
        WHERE email_verified_at >= UTC_DATE() - INTERVAL ? DAY
        GROUP BY day`,
      [days - 1],
    ),
  ]);
  const authByDay = new Map(auth.map((r) => [r.day, r]));
  const signupsByDay = new Map(signups.map((r) => [r.day, Number(r.n)]));
  const out: DailyRow[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i),
    );
    const key = d.toISOString().slice(0, 10);
    const r = authByDay.get(key);
    out.push({
      day: key,
      signups: signupsByDay.get(key) ?? 0,
      signins: Number(r?.signins ?? 0),
      failed: Number(r?.failed ?? 0),
    });
  }
  return out;
}

export interface CountRow {
  label: string;
  n: number;
}

async function counts(sql: string, params: unknown[] = []): Promise<CountRow[]> {
  const rows = await query<Row & { label: string | null; n: number | string }>(sql, params);
  return rows.map((r) => ({ label: r.label ?? 'Unknown', n: Number(r.n) }));
}

export function topCountries(days = 30) {
  return counts(
    `SELECT country AS label, COUNT(*) AS n FROM auth_snapshots
      WHERE occurred_at > UTC_TIMESTAMP() - INTERVAL ? DAY
      GROUP BY country ORDER BY n DESC LIMIT 10`,
    [days],
  );
}

export function topBrowsers(days = 30) {
  return counts(
    `SELECT browser AS label, COUNT(*) AS n FROM auth_snapshots
      WHERE occurred_at > UTC_TIMESTAMP() - INTERVAL ? DAY
      GROUP BY browser ORDER BY n DESC LIMIT 8`,
    [days],
  );
}

export function failureReasons(days = 30) {
  return counts(
    `SELECT outcome AS label, COUNT(*) AS n FROM auth_snapshots
      WHERE occurred_at > UTC_TIMESTAMP() - INTERVAL ? DAY AND outcome NOT IN ('ok', 'code_sent')
      GROUP BY outcome ORDER BY n DESC`,
    [days],
  );
}

export async function getVpnShare(
  days = 30,
): Promise<{ total: number; proxied: number; mismatched: number }> {
  const row = await queryOne<
    Row & { total: number; proxied: string | null; mismatched: string | null }
  >(
    `SELECT COUNT(*) AS total, SUM(is_proxy = 1) AS proxied, SUM(timezone_mismatch = 1) AS mismatched
       FROM auth_snapshots WHERE occurred_at > UTC_TIMESTAMP() - INTERVAL ? DAY`,
    [days],
  );
  return {
    total: Number(row?.total ?? 0),
    proxied: Number(row?.proxied ?? 0),
    mismatched: Number(row?.mismatched ?? 0),
  };
}

export interface TopAttemptRow extends Row {
  email: string;
  failures: number;
  ips: number;
  last_at: Date;
  countries: string | null;
}

/** Emails with the most failed sign-in steps recently (brute-force targets). */
export function topFailedEmails(days = 7) {
  return query<TopAttemptRow>(
    `SELECT email, COUNT(*) AS failures, COUNT(DISTINCT ip) AS ips, MAX(occurred_at) AS last_at,
            GROUP_CONCAT(DISTINCT country_code ORDER BY country_code SEPARATOR ', ') AS countries
       FROM auth_snapshots
      WHERE occurred_at > UTC_TIMESTAMP() - INTERVAL ? DAY AND email IS NOT NULL
        AND outcome NOT IN ('ok', 'code_sent')
      GROUP BY email ORDER BY failures DESC LIMIT 10`,
    [days],
  );
}

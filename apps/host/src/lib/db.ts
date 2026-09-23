import 'server-only';
import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from 'mysql2/promise';

/**
 * MySQL connection pool (Hostinger). Configured only through environment variables, set in
 * hPanel for production and in apps/host/.env.local for development:
 *   MAIN_DB_NAME, MAIN_DB_USER, MAIN_DB_PWD            (required)
 *   MAIN_DB_HOST (default "localhost"), MAIN_DB_PORT (default 3306)   (optional)
 * Never hardcode credentials.
 * Every connection runs in UTC so DATETIME columns are always UTC.
 */
const globalForDb = globalThis as unknown as { devquakePool?: Pool };

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`[db] Missing environment variable ${name}`);
  return value;
}

export function getPool(): Pool {
  if (globalForDb.devquakePool) return globalForDb.devquakePool;

  const pool = mysql.createPool({
    host: process.env.MAIN_DB_HOST || 'localhost',
    port: Number(process.env.MAIN_DB_PORT || 3306),
    database: requireEnv('MAIN_DB_NAME'),
    user: requireEnv('MAIN_DB_USER'),
    password: requireEnv('MAIN_DB_PWD'),
    connectionLimit: 5,
    waitForConnections: true,
    timezone: 'Z',
    dateStrings: false,
    charset: 'utf8mb4_unicode_ci',
    enableKeepAlive: true,
  });
  pool.pool.on('connection', (conn) => {
    conn.query("SET time_zone = '+00:00'");
  });

  // Reuse the pool across hot reloads in development.
  globalForDb.devquakePool = pool;
  return pool;
}

export type Row = RowDataPacket;

export async function query<T extends Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await getPool().query<T[]>(sql, params);
  return rows;
}

export async function queryOne<T extends Row>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  const [result] = await getPool().query<ResultSetHeader>(sql, params);
  return result;
}

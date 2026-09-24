import 'server-only';
import mysql, { type Pool, type PoolConnection, type ResultSetHeader } from 'mysql2/promise';
import type { PluginDatabase, PluginExecuteResult } from '@devquake/plugin-sdk';

/**
 * One MySQL pool per plugin database (ADR 0007). Credentials come only from the plugin's own
 * environment variables, e.g. for "shopping": SHOPPING_DB_NAME, SHOPPING_DB_USER,
 * SHOPPING_DB_PWD, optional SHOPPING_DB_HOST / SHOPPING_DB_PORT (fallback: MAIN_DB_HOST/PORT).
 * The platform never uses these pools for its own tables.
 */
const globalForPools = globalThis as unknown as { devquakePluginPools?: Map<string, Pool> };
const pools = (globalForPools.devquakePluginPools ??= new Map());

export function pluginEnvPrefix(pluginId: string): string {
  return `${pluginId.toUpperCase().replace(/-/g, '_')}_DB`;
}

function env(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function pool(pluginId: string): Pool | null {
  const existing = pools.get(pluginId);
  if (existing) return existing;
  const p = pluginEnvPrefix(pluginId);
  const database = env(`${p}_NAME`);
  const user = env(`${p}_USER`);
  const password = env(`${p}_PWD`);
  if (!database || !user || !password) return null;
  const created = mysql.createPool({
    host: env(`${p}_HOST`) || env('MAIN_DB_HOST') || 'localhost',
    port: Number(env(`${p}_PORT`) || env('MAIN_DB_PORT') || 3306),
    database,
    user,
    password,
    connectionLimit: 3,
    waitForConnections: true,
    timezone: 'Z',
    charset: 'utf8mb4_unicode_ci',
    enableKeepAlive: true,
  });
  created.pool.on('connection', (conn) => {
    conn.query("SET time_zone = '+00:00'");
  });
  pools.set(pluginId, created);
  return created;
}

type Runner = Pick<Pool, 'query'> | Pick<PoolConnection, 'query'>;

function bind(runner: Runner): Omit<PluginDatabase, 'transaction'> {
  return {
    async query<T>(sql: string, params: unknown[] = []) {
      const [rows] = await runner.query(sql, params);
      return rows as T[];
    },
    async execute(sql: string, params: unknown[] = []): Promise<PluginExecuteResult> {
      const [result] = await runner.query<ResultSetHeader>(sql, params);
      return { affectedRows: result.affectedRows, insertId: result.insertId };
    },
  };
}

/** The plugin's database, or undefined when its environment variables are not set. */
export function pluginDatabase(pluginId: string): PluginDatabase | undefined {
  const p = pool(pluginId);
  if (!p) return undefined;
  return {
    ...bind(p),
    async transaction(fn) {
      const conn = await p.getConnection();
      try {
        await conn.beginTransaction();
        const result = await fn(bind(conn));
        await conn.commit();
        return result;
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    },
  };
}

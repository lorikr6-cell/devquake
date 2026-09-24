#!/usr/bin/env node
/**
 * Applies pending SQL files in filename order and records them in that database's
 * schema_migrations (env vars loaded from apps/host/.env.local by `pnpm db:migrate`).
 *
 *   pnpm db:migrate                       platform database: db/migrations, MAIN_DB_*
 *   pnpm db:migrate --plugin shopping     a plugin's own database (ADR 0007):
 *                                         plugins/shopping/db/migrations, SHOPPING_DB_*
 *   ... --status                          list applied and pending migrations only
 *
 * Alternative without remote access: import the files one by one in phpMyAdmin.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mysql = createRequire(path.join(root, 'apps/host/package.json'))('mysql2/promise');

// --plugin <id>: that plugin's migrations and database; otherwise the platform database.
const pluginArg = process.argv.indexOf('--plugin');
const pluginId = pluginArg === -1 ? null : process.argv[pluginArg + 1];
if (pluginArg !== -1 && !/^[a-z][a-z0-9-]{0,30}[a-z0-9]$/.test(pluginId ?? '')) {
  console.error('[db] Usage: pnpm db:migrate --plugin <id>');
  process.exit(1);
}
const prefix = pluginId ? `${pluginId.toUpperCase().replace(/-/g, '_')}_DB` : 'MAIN_DB';
const dir = pluginId
  ? path.join(root, 'plugins', pluginId, 'db', 'migrations')
  : path.join(root, 'db', 'migrations');
if (!fs.existsSync(dir)) {
  console.error(`[db] No migrations folder: ${path.relative(root, dir)}`);
  process.exit(1);
}
const env = (name) => process.env[name]?.trim() || undefined;

for (const name of [`${prefix}_NAME`, `${prefix}_USER`, `${prefix}_PWD`]) {
  if (!env(name)) {
    console.error(`[db] Missing ${name}. Set it in apps/host/.env.local or the environment.`);
    process.exit(1);
  }
}

console.log(
  `[db] ${pluginId ? `Plugin "${pluginId}"` : 'Platform'} database ${env(`${prefix}_NAME`)}`,
);
const conn = await mysql.createConnection({
  host: env(`${prefix}_HOST`) || env('MAIN_DB_HOST') || 'localhost',
  port: Number(env(`${prefix}_PORT`) || env('MAIN_DB_PORT') || 3306),
  database: env(`${prefix}_NAME`),
  user: env(`${prefix}_USER`),
  password: env(`${prefix}_PWD`),
  multipleStatements: true,
  timezone: 'Z',
});

try {
  await conn.query("SET time_zone = '+00:00'");
  await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) NOT NULL PRIMARY KEY,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  const [rows] = await conn.query('SELECT version FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.version));

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const pending = files.filter((f) => !applied.has(f.replace(/\.sql$/, '')));

  if (process.argv.includes('--status')) {
    for (const f of files) console.log(`${pending.includes(f) ? 'pending' : 'applied'}  ${f}`);
  } else if (pending.length === 0) {
    console.log('[db] Up to date.');
  } else {
    for (const file of pending) {
      console.log(`[db] Applying ${file}`);
      // MySQL DDL auto-commits, so a failed file may be partially applied. Every statement
      // uses IF NOT EXISTS / INSERT IGNORE, so fixing the error and re-running is safe.
      await conn.query(fs.readFileSync(path.join(dir, file), 'utf8'));
      await conn.query('INSERT IGNORE INTO schema_migrations (version) VALUES (?)', [
        file.replace(/\.sql$/, ''),
      ]);
    }
    console.log(`[db] Applied ${pending.length} migration(s).`);
  }
} finally {
  await conn.end();
}

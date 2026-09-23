#!/usr/bin/env node
/**
 * Applies pending SQL files from db/migrations in filename order and records them in
 * schema_migrations. Uses MAIN_DB_NAME, MAIN_DB_USER, MAIN_DB_PWD and optional
 * MAIN_DB_HOST / MAIN_DB_PORT (loaded from apps/host/.env.local by `pnpm db:migrate`).
 *
 *   pnpm db:migrate            apply pending migrations
 *   pnpm db:migrate --status   list applied and pending migrations only
 *
 * Alternative without remote access: import the files one by one in phpMyAdmin.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'db', 'migrations');
const mysql = createRequire(path.join(root, 'apps/host/package.json'))('mysql2/promise');

for (const name of ['MAIN_DB_NAME', 'MAIN_DB_USER', 'MAIN_DB_PWD']) {
  if (!process.env[name]) {
    console.error(`[db] Missing ${name}. Set it in apps/host/.env.local or the environment.`);
    process.exit(1);
  }
}

const conn = await mysql.createConnection({
  host: process.env.MAIN_DB_HOST || 'localhost',
  port: Number(process.env.MAIN_DB_PORT || 3306),
  database: process.env.MAIN_DB_NAME,
  user: process.env.MAIN_DB_USER,
  password: process.env.MAIN_DB_PWD,
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

#!/usr/bin/env node
/**
 * Creates (or resets the password of) a platform administrator for /admin-cp.
 *
 *   pnpm admin:create            prompts for email, name and password, prints SQL to run in
 *                                phpMyAdmin (nothing leaves your machine)
 *   pnpm admin:create --apply    runs the SQL directly against MAIN_DB_* (needs Remote MySQL
 *                                access to Hostinger for your IP)
 *
 * The hash format must match apps/host/src/lib/auth/password.ts.
 */
import { randomBytes, scryptSync } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const N = 32768;
const R = 8;
const P = 1;
const MIN_PASSWORD_LENGTH = 12;

function hashPassword(password) {
  const salt = randomBytes(16);
  const key = scryptSync(password.normalize('NFKC'), salt, 64, {
    N,
    r: R,
    p: P,
    maxmem: 64 * 1024 * 1024,
  });
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      // Print the prompt, then swallow the echoed keystrokes.
      rl._writeToOutput = (s) => {
        if (s.includes(question)) process.stdout.write(question);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer);
    });
  });
}

const sqlString = (v) => `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;

const email = (await ask('Admin email: ')).trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email');
const name = (await ask('Display name: ')).trim() || email;
const password = await ask(`Password (min ${MIN_PASSWORD_LENGTH} chars): `, { hidden: true });
if (password.length < MIN_PASSWORD_LENGTH) {
  throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
}
if ((await ask('Repeat password: ', { hidden: true })) !== password) {
  throw new Error('Passwords do not match');
}

const hash = hashPassword(password);
const statements = [
  `INSERT INTO users (email, display_name, password_hash, status)
VALUES (${sqlString(email)}, ${sqlString(name)}, ${sqlString(hash)}, 'active')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), display_name = VALUES(display_name),
  status = 'active', failed_login_count = 0, locked_until = NULL, password_changed_at = UTC_TIMESTAMP();`,
  `INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.code = 'platform.admin'
WHERE u.email = ${sqlString(email)};`,
  // A password change signs out every existing session of this user.
  `UPDATE sessions s JOIN users u ON u.id = s.user_id SET s.revoked_at = UTC_TIMESTAMP()
WHERE u.email = ${sqlString(email)} AND s.revoked_at IS NULL;`,
];

if (!process.argv.includes('--apply')) {
  console.log('\n-- Run in phpMyAdmin (database u962314563_devquake) after the migrations:\n');
  console.log(statements.join('\n\n'));
  console.log('\n-- The hash above is safe to paste; it cannot be reversed into the password.');
} else {
  const mysql = createRequire(path.join(root, 'apps/host/package.json'))('mysql2/promise');
  const conn = await mysql.createConnection({
    host: process.env.MAIN_DB_HOST || 'localhost',
    port: Number(process.env.MAIN_DB_PORT || 3306),
    database: process.env.MAIN_DB_NAME,
    user: process.env.MAIN_DB_USER,
    password: process.env.MAIN_DB_PWD,
    timezone: 'Z',
  });
  try {
    for (const sql of statements) await conn.query(sql);
    console.log(`Admin ${email} is ready. Sign in at /admin-cp.`);
  } finally {
    await conn.end();
  }
}

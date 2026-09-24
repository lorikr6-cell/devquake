#!/usr/bin/env node
/**
 * Checks the SMTP settings the site uses and sends one test email.
 *
 *   pnpm mail:test                      sends to SMTP_USER itself
 *   pnpm mail:test someone@example.com  sends to that address
 *
 * Reads SMTP_USER, SMTP_PWD, SMTP_HOST, SMTP_PORT, MAIL_FROM from the environment or
 * apps/host/.env.local — the same values you put in hPanel. Mirrors apps/host/src/lib/mail/mailer.ts.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nodemailer = createRequire(path.join(root, 'apps/host/package.json'))('nodemailer');
const env = (name) => process.env[name]?.trim() || undefined;

const user = env('SMTP_USER');
const pass = env('SMTP_PWD');
const host = env('SMTP_HOST') || 'smtp.hostinger.com';
const port = Number(env('SMTP_PORT') || 465);
const from = env('MAIL_FROM') || `DevQuake <${user}>`;
const to = process.argv[2] || user;

if (!user || !pass) {
  console.error('SMTP_USER and SMTP_PWD are not set (environment or apps/host/.env.local).');
  process.exit(1);
}

// Warn (without printing the secret) when .env.local syntax would cut the password short:
// an unquoted "#" starts a comment, and a double quote inside "..." ends the value early.
const envFile = path.join(root, 'apps/host/.env.local');
if (fs.existsSync(envFile)) {
  const line = fs
    .readFileSync(envFile, 'utf8')
    .split(/\r?\n/)
    .find((l) => /^\s*SMTP_PWD\s*=/.test(l));
  const raw = line?.replace(/^\s*SMTP_PWD\s*=\s*/, '') ?? '';
  const quoted = /^'.*'\s*$/.test(raw) || /^"[^"]*"\s*$/.test(raw);
  if (raw && !quoted && /[#"'\s]/.test(raw.trim())) {
    console.warn(
      'WARNING: SMTP_PWD in apps/host/.env.local contains #, a quote or a space without being\n' +
        "wrapped in single quotes, so only part of it is read. Write it as SMTP_PWD='your-password'.\n",
    );
  } else if (/^"/.test(raw) && !/^"[^"]*"\s*$/.test(raw)) {
    console.warn(
      'WARNING: SMTP_PWD is in double quotes but contains a double quote. Use single quotes instead.\n',
    );
  }
}

console.log(`Server : ${host}:${port} (${port === 465 ? 'SSL/TLS' : 'STARTTLS'})`);
console.log(
  `Login  : ${user} (password read: ${pass.length} characters — compare with the real length)`,
);
console.log(`From   : ${from}`);
console.log(`To     : ${to}\n`);

function hint(err) {
  const code = err.code ?? '';
  const smtp = err.responseCode ?? 0;
  if (code === 'EAUTH' || smtp === 535)
    return [
      'Login rejected by the mail server. Check, in this order:',
      `  1. Sign in at https://mail.hostinger.com as ${user} with the same password. If that fails too,`,
      '     the password is wrong: hPanel → Emails → Email accounts → the mailbox → Change password.',
      '  2. The "password read" length above equals the real password length. If not, wrap it in',
      "     single quotes in apps/host/.env.local: SMTP_PWD='...'",
      '  3. SMTP_USER is the full mailbox address and that mailbox exists (not only a forwarder).',
    ].join('\n');
  if (['ETIMEDOUT', 'ECONNREFUSED', 'ESOCKET', 'ECONNECTION', 'EDNS'].includes(code))
    return `Cannot reach ${host}:${port}. Check SMTP_HOST, or try SMTP_PORT=587.`;
  if (smtp === 553 || smtp === 550 || code === 'EENVELOPE')
    return 'Sender refused: MAIL_FROM must use the same address as SMTP_USER (or remove MAIL_FROM).';
  return 'See the SMTP response above.';
}

const transport = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
});

try {
  process.stdout.write('1/2 Connecting and logging in… ');
  await transport.verify();
  console.log('OK');
  process.stdout.write('2/2 Sending a test email… ');
  const info = await transport.sendMail({
    from,
    to,
    subject: 'DevQuake SMTP test',
    text: 'If you can read this, the SMTP settings work. Sign-in codes will be delivered.',
  });
  console.log(`OK (${info.response})`);
  console.log(`\nDone. Check the inbox (and spam) of ${to}.`);
} catch (err) {
  console.log('FAILED\n');
  console.error(
    `Error: ${[err.code && `[${err.code}]`, err.responseCode && `SMTP ${err.responseCode}`, err.message].filter(Boolean).join(' ')}`,
  );
  if (err.response && err.response !== err.message) console.error(`Server said: ${err.response}`);
  console.error(`\nHint: ${hint(err)}`);
  process.exit(1);
}

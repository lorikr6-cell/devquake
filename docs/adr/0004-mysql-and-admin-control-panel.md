# 0004 — MySQL database and owner-only admin control panel

- Status: Accepted
- Date: 2026-09-23

## Context

The site owner needs a private place to sign in, track ideas and their progress, and see what
happens across the host and every plugin. Hostinger includes MySQL, the roadmap lists accounts,
roles and a database as platform prerequisites, and the app runs on Hostinger's managed Node.js
hosting (no native-module builds guaranteed, npm-only install of the deploy bundle).

## Decision

- **Database**: Hostinger MySQL (`u962314563_devquake`) accessed from the host through
  `mysql2` (a connection pool in `apps/host/src/lib/db.ts`). Configuration only through
  `MAIN_DB_*` environment variables. Schema lives in plain, re-runnable SQL files in
  `db/migrations/`, applied with phpMyAdmin or `pnpm db:migrate`. `mysql2` is a
  `serverExternalPackages` entry and is added to the deploy bundle's `package.json`.
- **Accounts**: `users`, `roles` (scoped to `platform` or a plugin id), `user_roles`. The schema
  is shared with future plugin accounts; only `platform.admin` may use the panel.
- **Passwords**: Node's built-in scrypt (N=32768, r=8, p=1), no native dependency.
- **Sessions**: opaque random token in an `HttpOnly`, `SameSite=Strict`, `__Host-` prefixed
  cookie (host-only, never shared with plugin subdomains); the database stores only its SHA-256.
  12 h absolute lifetime, 2 h idle timeout, revocation on logout and password reset.
- **Brute force**: every attempt is recorded in `login_attempts`; 5 failures per email or 20
  per IP in 15 minutes are throttled, and 5 wrong passwords lock the account for 15 minutes.
  All failures return the same message, and unknown emails still run scrypt.
- **Location**: `/admin-cp` on the root domain, with no links from the site, `noindex` headers,
  `no-store`, and anti-framing headers. There is no sign-up; admins are created with
  `pnpm admin:create`. Every page and server action checks the session itself
  (`requireAdmin()`), not only the layout.
- **Activity log**: one `activity_log` table for the whole site, keyed by `source` (`host`,
  `admin-cp`, plugin id). The host writes auth events, admin changes and unhandled plugin API
  errors. It is written through `logActivity()`, which never throws.

## Consequences

- Positive: no extra services or costs; no native modules; secrets stay in hPanel; the tables
  are ready for platform-wide accounts and per-plugin roles.
- The session cookie is deliberately host-only. Cross-subdomain login for plugin users will need
  a separate cookie on `.devquake.com` (future ADR).
- Plugins cannot write to the activity log yet: that needs a `log` function on `PluginContext`,
  which is an SDK change (separate ADR, backward compatible).
- Two-factor authentication is prepared in the schema (`users.totp_secret`) but not implemented.
- Log retention is manual until a scheduled job exists.

## Alternatives considered

- **Managed Postgres (Supabase)**: good tooling, but an extra provider and cost while Hostinger
  MySQL is included.
- **ORM (Prisma/Drizzle)**: Prisma needs a native engine binary that is risky on managed
  hosting; plain SQL is enough for the current size. Revisit if the schema grows.
- **Auth.js / hosted auth**: more moving parts than a single-owner panel needs; can be
  adopted later for public accounts on top of the same `users` table.
- **bcrypt/argon2 packages**: native builds; scrypt is built into Node with equivalent strength.
- **Stateless JWT sessions**: cannot be revoked server-side without a store anyway.

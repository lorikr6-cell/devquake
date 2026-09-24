# 0007 — A database per plugin, the signed-in user in PluginContext, and platform hooks

- Status: Accepted
- Date: 2026-09-24

## Context

Projects need their own data and their own development cycle, while the platform must still be
able to read summary data from them (admin dashboard) and remove a user's data from them when
the user deletes their account (GDPR). Options considered: a separate Next.js app and git repo
per project, or plugins in this monorepo with their own database. First project: `shopping`.

## Decision

Keep projects as **plugins in the monorepo**, each with **its own MySQL database**, and extend
the plugin SDK — additively, every new field is optional, existing plugins keep working:

- `PluginManifest.database?: boolean` — the plugin owns a database. The host opens it from
  `<ID>_DB_NAME`, `<ID>_DB_USER`, `<ID>_DB_PWD` (and optional `<ID>_DB_HOST`/`<ID>_DB_PORT`,
  falling back to `MAIN_DB_HOST`/`MAIN_DB_PORT`), where `<ID>` is the plugin id in upper case
  with `-` → `_` (e.g. `SHOPPING_DB_NAME`).
- `PluginContext.db?: PluginDatabase` — a small query interface (`query`, `execute`,
  `transaction`) bound to the plugin's own database. The SDK only defines the interface; the host
  implements it with `mysql2`, so the SDK stays dependency-free. Undefined when the plugin has no
  database or its env vars are missing.
- `PluginContext.user?: PluginUser | null` — the signed-in user (`id`, `displayName`, `isAdmin`),
  from the session shared with subdomains (ADR 0006). No email: plugins get the minimum.
- `PluginContext.people?: PluginPeople` — `referrals()` returns the signed-in user's referral
  network (active accounts they referred plus their own referrer) as `PluginPerson`
  (`id`, `displayName`, `relation`, `hasAccess` = can already open this app). Apps use it to
  offer "share with your friends" without ever seeing email addresses. Undefined when signed out.
- `PluginDefinition.platform?: () => Promise<PluginPlatformModule>` with optional hooks the host
  calls in-process:
  - `getStats(ctx)` → a few labelled numbers for the admin dashboard;
  - `deleteUserData(userId, ctx)` → called during account deletion, before the platform deletes
    the user. If any plugin fails, the deletion is aborted so no data is left behind.
- **Rules**: a plugin's database stores the platform user id as a plain number (no cross-database
  foreign keys); the platform never queries a plugin's tables and plugins never touch the platform
  database. Plugin schemas live in `plugins/<id>/db/migrations/` and are applied with
  `pnpm db:migrate --plugin <id>` (each database has its own `schema_migrations`).
- **Writes from plugin pages** go through the plugin's `/api` routes (which receive the same
  context). The host rejects non-GET API requests whose `Origin` is not the app's own origin
  (CSRF protection).

## Consequences

- One deployment, shared sign-in, brand and theme; each project can still be developed and
  migrated independently, and its data is isolated in its own database with its own credentials.
- On Hostinger each plugin database is created in hPanel (Databases) and its credentials added
  as environment variables.
- A plugin that outgrows the host (realtime, own scaling) can become `apps/<id>` later; the
  database-per-plugin rule makes that move mechanical (ADR 0002).

## Alternatives considered

- **Separate Next.js app + repo per project**: independent deploys, but duplicated auth, brand
  and deployment work, cross-repo coordination for platform changes, and more Hostinger Node
  apps. Revisit per project when it needs its own runtime.
- **Shared platform database with prefixed tables**: simpler, but no isolation and no way to hand
  a project its own credentials or move it out later.
- **Cross-database SQL from the platform**: couples the platform to every plugin's tables and
  breaks as soon as credentials differ.

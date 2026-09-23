# apps/host — the DevQuake host application (Next.js 16, App Router)

Serves `devquake.com` and mounts every plugin on `<id>.devquake.com`.

## Key files

- `src/proxy.ts` — subdomain router (Next 16 `proxy`, formerly `middleware`). Rewrites plugin
  subdomains to `/plugin-host/<id>/...` and `/plugin-api/<id>/...`. Keep it thin: no DB calls.
- `src/lib/domain.ts` — the ONLY place that knows about domains/subdomains. Reuse, don't duplicate.
- `src/lib/plugins.ts` — loads plugins from the generated registry, builds `PluginContext`.
- `src/app/plugin-host/**`, `src/app/plugin-api/**` — generic plugin mount points. They must stay
  plugin-agnostic: never import a specific plugin here.
- `src/plugins/*.generated.ts` — produced by `pnpm registry`. NEVER edit by hand.
- `src/lib/db.ts` — MySQL pool (`MAIN_DB_*` env vars). Server-only; always use `?` placeholders.
- `src/lib/auth/` — scrypt passwords, DB sessions, login throttling, `requireAdmin()`.
- `src/lib/activity.ts` — `logActivity()` for the site-wide `activity_log` (never throws).
- `src/app/admin-cp/` — owner control panel (login, dashboard, ideas, projects, activity).
  Unlinked and root-domain only. Every page AND server action must call `requireAdmin()`.
  Schema changes go in a new `db/migrations/NNNN_*.sql` (see `db/README.md`).

## Rules

- Next.js 16: `params` and `searchParams` are Promises — always `await` them.
- Server Components by default; add `'use client'` only on leaf components that need it.
- Host-only pages (landing, auth, admin) go under `src/app/` like a normal Next app.
  Do not use a top-level path that a plugin might expect to own on its subdomain; the proxy
  only rewrites on subdomains, so host paths on the root domain are safe.
- Reserved subdomains are defined in `scripts/generate-registry.mjs` (`RESERVED`).

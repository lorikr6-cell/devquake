# Architecture overview

DevQuake is **one Next.js application** (the host) that serves the main site on `devquake.com`
and mounts any number of **plugins**, each on its own subdomain (`<id>.devquake.com`).
Plugins are developed as separate workspace packages in `plugins/<id>/`, so each behaves like
its own project (own code, docs, changelog, dependencies) while sharing one deployment, one
design system and one runtime.

```mermaid
flowchart LR
  U[Browser] -->|devquake.com| P[proxy.ts]
  U -->|shopping.devquake.com| P
  P -->|root domain| H[Host routes<br/>apps/host/src/app]
  P -->|subdomain page| PH["/plugin-host/[plugin]/[[...path]]"]
  P -->|subdomain /api/*| PA["/plugin-api/[plugin]/[[...path]]"]
  PH --> R[Generated registry]
  PA --> R
  R --> S[plugins/shopping]
  S --> SDK[@devquake/plugin-sdk]
  S --> UI[@devquake/ui]
  S -.->|ctx.db| SDB[(own MySQL database)]
```

## Monorepo

| Path                  | Package                 | Role                                                      |
| --------------------- | ----------------------- | --------------------------------------------------------- |
| `apps/host`           | `@devquake/host`        | Next.js 16 app, routing, shared layout, auth, `/admin-cp` |
| `packages/plugin-sdk` | `@devquake/plugin-sdk`  | Plugin contract, `definePlugin`, `matchRoute`, changelog  |
| `packages/ui`         | `@devquake/ui`          | Shared components (Tailwind), logo, QR, release notes     |
| `packages/tsconfig`   | `@devquake/tsconfig`    | Shared TS config                                          |
| `plugins/<id>`        | `@devquake/plugin-<id>` | One plugin each                                           |
| `templates/plugin`    | —                       | Source for `pnpm new:plugin`                              |

Tooling: pnpm workspaces, Turborepo (task caching/orchestration), TypeScript strict,
Tailwind CSS v4, Vitest.

## Why this shape

- **Build-time integration** (plugins are workspace packages compiled into the host) gives type
  safety, one deploy, shared UI and zero runtime plugin-loading risk. See ADR 0001 and 0002.
- **Lazy loading**: each plugin's pages/APIs are dynamic imports, so a plugin costs nothing until
  its subdomain is visited.
- **Escape hatch**: a plugin that outgrows the host (own scaling, own stack) can later become a
  separate app behind the same subdomain via the reverse proxy, without changing its URL.

## Data, auth and the admin panel

The host owns the database connection (`apps/host/src/lib/db.ts`, MySQL on Hostinger), accounts
and sessions (`src/lib/auth/`), email (`src/lib/mail/`) and the site-wide activity log
(`src/lib/activity.ts`). Visitors sign up and sign in on the landing page; every sign-in finishes
with a code sent by email (ADR 0005). The control panel lives at `/admin-cp` on the root domain
only (unlinked, `noindex`): the owner manages users, statistics and the activity log there;
admins granted by the owner see only dashboard, ideas and projects. Schema and setup:
[db/README.md](../../db/README.md); decision record: ADR 0004.

Apps never touch the platform database. An app that needs storage declares
`manifest.database: true` and gets **its own** MySQL database through `ctx.db`, plus the
signed-in user (`ctx.user`), their referral network (`ctx.people`) and its release notes
(`ctx.changelog`); the platform reaches apps only through their hooks (dashboard stats,
deleting a user's data). See ADR 0007 and 0008, and `plugins/shopping` for the reference app.

# Plugin: Shared shopping lists (`shopping`)

Served on `shopping.devquake.com`. Contract: `packages/plugin-sdk/src/types.ts`.
Full guide: `docs/guides/creating-a-plugin.md`.

## Rules for this plugin

- All routes are declared in `src/index.ts` (`pages` and `api`). A file that is not declared
  there is not reachable. Patterns: `/`, `/posts/:id`, `/docs/*rest`.
- Page modules: default-export a component receiving `PluginPageProps`; optionally export
  `metadata` or `generateMetadata`.
- API modules: export `GET`/`POST`/... typed as `PluginApiHandler`. Served under `/api/...`.
- Import ONLY from: this plugin, `@devquake/plugin-sdk`, `@devquake/ui`, `next`, `react`,
  and this plugin's own dependencies. Never import from `apps/host` or another plugin.
- Links inside the plugin are root-relative (`/about`), because the browser URL is the subdomain.
- Keep `README.md` route table and `CHANGELOG.md` updated with every change.

## Plugin-specific notes

- Own database (ADR 0007): every query goes through `ctx.db` with `?` placeholders. The platform
  user id is stored as a plain number; display names are copied in (`list_members`,
  `added_by_name`). Never query the platform database.
- `ctx.user` may be null and `ctx.db` undefined: pages use `pageScope()` (components/guard.tsx),
  API modules wrap handlers in `api()` (lib/api.ts).
- Every data function checks membership (`requireMember`/`requireOwner`) before touching a list,
  and every change calls `touch()` so polling clients refresh.
- Adding members directly is only allowed for people in `ctx.people.referrals()`; everyone else
  joins through an invite code.
- Store type codes (`lib/store-types.ts`) are stored in the database: add new codes freely, but
  never rename or remove one without a migration.
- Schema changes: add a new file in `db/migrations/` (re-runnable), never edit an applied one.
- `lib/model.ts`, `lib/store-types.ts` and `lib/validate.ts` are pure and unit-tested.

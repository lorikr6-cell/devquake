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
- Schema changes: add a new file in `db/migrations/` (re-runnable), never edit an applied one,
  and list it in the README's migration table.
- Pure and unit-tested: `lib/model.ts`, `store-types.ts`, `validate.ts`, `dates.ts`,
  `stats.ts`, `suggestions.ts`, `events.ts`, `photos.ts`. Keep logic there, not in components.
- Item states: `done` = bought, `dropped` = struck out as not needed. Use the helpers in
  `lib/model.ts` (`isOpen`, `countsTowardsTotal`, `isWasted`) for totals and styling; bought
  and then dropped items still count (money spent) and show darker with 🙃.
- Dates are `YYYY-MM-DD` strings (`lib/dates.ts`, SQL `DATE_FORMAT`), never `Date` objects;
  "today" is the visitor's local day (`useToday`), the server's value is only a first guess.
- Every change another member should hear about calls `recordEvent()` (lib/mutations.ts); the
  bell (`components/notification-center.tsx`) polls `/api/events`. Events are kept 30 days.
- Live updates are polling only: open lists every 4 s (`?v=` version, 204 when unchanged), the
  home screen `/api/changes` every 5 s. Every change must `touch()` the list.
- Photos live in `item_photos` and are served by `/api/lists/:id/items/:itemId/photo` to
  members only; the browser shrinks them first (`components/photo-upload.ts`).
- `deleteUserData` (src/platform.ts) runs on account deletion AND on unsubscribing: new tables
  with a user id must be cleaned there.
- `CHANGELOG.md` is user-facing (version button); technical notes go in the README.
- `/help` is a public page (ADR 0009): readable signed out, so it must not use `ctx.db` or the
  API. Analytics events go through `trackEvent()` (list in the README); never send names or
  contents.

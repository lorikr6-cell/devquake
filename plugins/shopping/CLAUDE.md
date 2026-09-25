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
- Every bug fix or feature bumps the version shown in the app: `manifest.version` in
  `src/index.ts` AND `package.json` (patch `x.y.Z` for fixes, minor `x.Y.0` for features), with a
  new `## x.y.z` entry at the top of `CHANGELOG.md`. The changelog is shown to users (ADR 0008):
  plain-language notes of what changed for them; never rewrite or reuse a released entry.
  `src/version.test.ts` fails when the three disagree. Then run `node scripts/generate-registry.mjs`.
- Keep the `README.md` route table updated with every change.
- Languages (ADR 0011): the app is in English, German, Romanian and Hungarian. The page
  language is `ctx.locale` (the host strips the `/de`, `/ro`, `/hu` prefix before routing, so
  routes stay the same). Every text shown to users comes from the plugin's catalog (English plus
  the three translations, same keys and `{placeholders}`), never a string in a component. Use
  `Link` from `@devquake/ui` (not `next/link`) and localize `router.push`/`redirect` targets with
  `localizePath`, so the language is kept. Dates and money use the page language's tag
  (`LOCALE_TAGS`). Keep the `LanguagePicker` in the toolbar. API errors are answered in the
  visitor's language too. `CHANGELOG.<de|ro|hu>.md` translations are optional; when present they
  must list the same versions as `CHANGELOG.md`.

## Plugin-specific notes

- Visibility rule: a user sees ONLY lists they are on (`list_members`), in every view: home,
  Today, calendar, statistics, suggestions, notifications, photos and the API. Every query that
  reads lists, items, stores or members must join `list_members` for the current user (or go
  through `requireMember`); statistics may also use `deleted_list_members` (lists the user was
  on when they were deleted). Never add an admin or owner bypass.

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
  "today" is the visitor's local day: `todayIn(ctx.timeZone)` on the server, `useToday` in the
  browser. Timestamps (if ever shown) go through `formatDateTime(value, ctx.timeZone)`
  (ADR 0010); the database stores UTC.
- Every change another member should hear about calls `recordEvent()` (lib/mutations.ts); the
  bell (`components/notification-center.tsx`) polls `/api/events`. Events are kept 30 days.
- Live updates are polling only: open lists every 4 s (`?v=` version, 204 when unchanged), the
  home screen `/api/changes` every 5 s. Every change must `touch()` the list.
- Photos live in `item_photos` and are served by `/api/lists/:id/items/:itemId/photo` to
  members only; the browser shrinks them first (`components/photo-upload.ts`).
- `deleteUserData` (src/platform.ts) runs on account deletion AND on unsubscribing: new tables
  with a user id must be cleaned there.
- Deleted lists stay in the database for statistics (`lists.deleted_at`, people in
  `deleted_list_members`). Access always goes through `list_members`; never read
  `deleted_list_members` outside `statsInput()`, and count only `deleted_at IS NULL` lists as
  live ones.
- `CHANGELOG.md` is user-facing (version button); technical notes go in the README. Each
  release also gets its entry in `CHANGELOG.de.md`, `CHANGELOG.ro.md` and `CHANGELOG.hu.md`.
- Texts: `src/i18n/screens.ts` (screens), `src/i18n/app-texts.ts` (store types, notifications,
  API errors, field names) and `src/i18n/manual.ts` (the `/help` manual as blocks with `**bold**`
  and `{host}`). Server code uses `translator(localeOf(ctx), namespace)`, client components
  `useT(namespace)` and `useFormat()` (dates, weekdays, money in the page language),
  `useAppRouter()` for `push`. Store type labels come from `storeTypes.<code>`; the English ones
  in `lib/store-types.ts` must match (tested). Data functions throw `HttpError(status, key,
params)`; `api()` translates `errors.<key>` (and `fields.<field>`). Units typed by users are
  stored as typed; only the suggestions (`list.units`) are translated.
- `/help` is a public page (ADR 0009): readable signed out, so it must not use `ctx.db` or the
  API. Analytics events go through `trackEvent()` (list in the README); never send names or
  contents.

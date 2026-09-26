# Plugin: Utility bill manager (`utilities`)

Served on `utilities.devquake.com`. Contract: `packages/plugin-sdk/src/types.ts`.
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
- Dates (ADR 0010): store UTC; show every timestamp with `formatDateTime(value, ctx.timeZone)`
  from `@devquake/ui`; convert typed date-times with `localDateTimeToUtc` before saving.
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

- Visibility rule: a person sees ONLY utilities they are a member of (`utility_members`), and
  everything below them. Every query that reads utilities, bills, files, readings, photos,
  payments or comments joins `utility_members` for the current user (or goes through
  `requireMember` / `utilityOfBill` in `lib/data.ts`). Never add an admin bypass.
- Roles: the utility's creator is the **manager** (`role = 'owner'`): only they add, edit and
  delete bills, record payments, mark the provider paid, invite and remove people. Members send
  their own readings and comment. The manager may enter anyone's reading.
- Split rules live in `lib/split.ts` (pure, tested) and are documented in the README. Keep all
  money maths there, in cents; pages only display `BillSplit`.
- Everyone must have a profile (full name + address) before using the app: pages call
  `requireProfile()` (components/guard.tsx); create/join APIs refuse without one.
- Own database (ADR 0007): every query through `ctx.db` with `?` placeholders; user ids as
  plain numbers; display names copied in. Never query the platform database.
- `deleteUserData` (src/platform.ts) runs on account deletion AND unsubscribing: new tables
  with a user id (or files, photos) must be cleaned there in the same change.
- Category codes (`lib/model.ts`) are stored in the database: add freely, never rename or
  remove without a migration. Labels are `categories.<code>` in the catalog (tested).
- Months are `YYYY-MM` strings, days `YYYY-MM-DD` (`lib/dates.ts`, SQL `DATE_FORMAT`);
  "this month" is the visitor's (`todayIn(ctx.timeZone)`). Comment times are UTC and shown
  with `formatDateTime(…, ctx.timeZone)` (ADR 0010).
- Uploads are checked by content (`lib/files.ts`): PDFs ≤ 4 MB, photos JPEG/PNG/WebP ≤ 2 MB.
- Server pages format with `formatters()` from `lib/format.ts`; client components use
  `useFormat()`. Never export plain helpers from a `'use client'` file for server use.
- Texts: `src/i18n/screens.ts`, `app-texts.ts` (categories, states, errors, fields) and
  `manual.ts` (the `/help` manual, blocks with `**bold**` and `{host}`). Data functions throw `HttpError(status, key, params)`; `api()`
  translates `errors.<key>` (and `fields.<field>`). Each release also gets its entry in
  `CHANGELOG.de.md`, `CHANGELOG.ro.md` and `CHANGELOG.hu.md`.
- `/help` is public (ADR 0009): it must not use `ctx.db` or the API. Analytics events go
  through `trackEvent()`; never send names, amounts or addresses.

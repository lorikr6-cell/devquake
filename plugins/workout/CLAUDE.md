# Plugin: Workout tracker (`workout`)

Served on `workout.devquake.com`. Contract: `packages/plugin-sdk/src/types.ts`.
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

- Placeholder release: `src/pages/home.tsx` shows a fixed sample week (`src/lib/sample.ts`) and
  greets `ctx.user`. No database yet; the planned features are in
  `docs/plugins/ideas/workout.md`. Replace the sample with real data when logging is built.
- Texts: `src/i18n/screens.ts` (en, de, ro, hu). Server code uses
  `translator(localeOf(ctx))`; client components `useT(namespace)`. Numbers, weekdays and dates
  use `LOCALE_TAGS[locale]`.
- Each release also gets its entry in `CHANGELOG.de.md`, `CHANGELOG.ro.md` and
  `CHANGELOG.hu.md`.
- Access is decided by the host (subscribers, assigned users, admins; ADR 0006). Pages still
  handle `ctx.user === null` (local development without a database).

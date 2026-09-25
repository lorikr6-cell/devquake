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

- Design and rules of the routines, workouts, autosave and illustrations: ADR 0013. Product
  phases: `docs/plugins/ideas/workout.md`.
- Own database (ADR 0007, `WORKOUT_DB_*`): every query goes through `ctx.db` with `?`
  placeholders, in `src/lib/data.ts`, always scoped to the user; never query the platform
  database. `ctx.db` is undefined without the variables (pages then say the app is being set
  up). Schema changes: a new re-runnable file in `db/migrations/`, listed in the README. Every
  table with a user id must be covered by `deleteUserData` in `src/platform.ts`.
- Units: the database holds kg, cm and metres only; convert at the edges with
  `src/lib/units.ts`.
- Catalogue: add or change exercises and equipment in `src/lib/catalog.ts` (texts in all four
  languages in `src/i18n/exercises.ts`; a motion in `src/illustrations/motions.ts` or an icon
  in `icons.ts` only when the automatic one does not fit), then `UPDATE_SEED=1 pnpm --filter @devquake/plugin-workout test`.
  After a seed file was released, changes go into a new migration (`SEED_MIGRATION`).
- Icons are rendered as markup (`SvgIcon`): only ever from `icons.ts` or the `equipment`
  table, never from user input.
- The workout screen never calls the API for a change directly: it creates ops, applies them
  with `src/lib/workout-state.ts` and queues them (`POST /api/sessions/:id/ops`). New ops
  must stay safe to send twice or late.
- New exercises may leave out `motion`/`prop` (and equipment its icon): illustrations are then
  chosen automatically (`src/illustrations/auto.ts`). Give one only when the automatic one is
  wrong.
- Photos are private: every photo query is scoped to `user_id`, served with `private` caching,
  and removed by `deleteUserData`.
- The voice coach speaks only texts from `voice.<style>.*` (all four languages, all three
  styles); settings live on the device (`src/lib/voice.ts`).
- The monthly email is the `scheduled` hook in `src/platform.ts` (ADR 0014): keep it idempotent
  (`monthly_reports`) and batched.
- Texts: `src/i18n/screens.ts`, `src/i18n/exercises.ts` and `src/i18n/progress.ts` (en, de, ro,
  hu). Server code uses `translator(localeOf(ctx))`; client components `useT(namespace)`.
  Numbers, weekdays and dates use `LOCALE_TAGS[locale]`.
- Each release also gets its entry in `CHANGELOG.de.md`, `CHANGELOG.ro.md` and
  `CHANGELOG.hu.md`.
- Access is decided by the host (subscribers, assigned users, admins; ADR 0006). Pages still
  handle `ctx.user === null` (local development without a database).
- Own routines and the plan (ADR 0018): `src/lib/own-routines.ts` (queries), `routine-input.ts`
  and `plan.ts` (pure, tested). Own routines are `routines.source = 'custom'`: only they can be
  edited or deleted, and "Create my routines again" never touches them. Plan times are
  wall-clock minutes in the person's time zone, not timestamps; `savePlanEntry` refuses
  overlapping slots inside a locked transaction. Regenerating moves plan slots to the new
  suggested routine with the same template (`remapPlanAfterRegeneration`).
- ADR 0019: the voice speaks `voice.<set>.*` where the set is `voiceTextSet(settings)` (the
  Crazy style has `crazyMale` and `crazyFemale`; every set needs every key in all languages).
  A missing male/female voice is synthesised by pitch (`voiceTuning`). Age groups
  (`ageGroup`, from `MIN_AGE` 6) limit difficulty, sets and weights for children. Own exercises
  have slug `u<id>` and their own name: show names with `exerciseName()` / `exerciseHowTo()`,
  never `t('exercises.<slug>.name')` directly. Reminders are sent by `scheduled`
  (`sendReminders`, idempotent through `plan_reminders`) at the person's local time.

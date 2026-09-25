# Workout tracker

DevQuake app served at `https://workout.devquake.com`. Product description and phases:
[docs/plugins/ideas/workout.md](../../docs/plugins/ideas/workout.md); decisions:
[ADR 0013](../../docs/adr/0013-workout-routines-and-guided-sessions.md) (routines, guided
workouts) and [ADR 0015](../../docs/adr/0015-workout-progress-voice-and-photos.md) (voice
coach, calendar, photos, monthly email).

**Status: 0.4.0.** A first visit opens a setup wizard: profile (birth year, height in cm or
ft + in, weight in kg or lb, experience, goal, workouts per week, time per workout, low
impact), places (gym, home, outside), the equipment at home, and an optional starting photo.
The app makes three routines per place, each with a warm-up. Repetitions are scaled by how hard
each exercise is. A workout runs full screen on the phone:

- an animated stick figure, the suggested repetitions prefilled and one big button;
- a voice coach (countdowns, sets, rests, next exercise, cheering; female or male voice; calm,
  normal or motivational; mutable) and encouraging lines during rests;
- rest timers and auto-advance;
- autosave after 10 seconds, an offline queue, and a sign-in kept alive while the workout runs.

Afterwards come a summary with what improved, a calendar (day, month, year) with statistics,
progress photos per month and year with a before-and-after view, and a monthly summary email.
A user manual (`/help`, the ? in the toolbar) explains all of it and is open to everyone.

Signing in is shared with DevQuake: the session cookie is set for `.devquake.com`, and the host
only lets the project's subscribers, assigned users and admins in (ADR 0006). The app itself
never asks for credentials.

## Routes

| Type | Pattern                   | File                           | Purpose                                                     |
| ---- | ------------------------- | ------------------------------ | ----------------------------------------------------------- |
| Page | `/`                       | `src/pages/home.tsx`           | Dashboard; redirects to `/setup` without a profile          |
| Page | `/setup`                  | `src/pages/setup.tsx`          | Setup wizard (profile, places, equipment)                   |
| Page | `/profile`                | `src/pages/profile.tsx`        | Change profile, places, equipment; create routines again    |
| Page | `/routines/:id`           | `src/pages/routine.tsx`        | One routine: animations, how-to, sets; Start                |
| Page | `/workout/:id`            | `src/pages/workout.tsx`        | The guided workout (full screen)                            |
| Page | `/history`                | `src/pages/history.tsx`        | Calendar: `?view=day\|month\|year&date=`, stats, photos     |
| Page | `/history/:id`            | `src/pages/summary.tsx`        | Summary of a finished workout, improvements, feedback       |
| Page | `/progress`               | `src/pages/progress.tsx`       | Progress photos, before and after                           |
| Page | `/help`                   | `src/pages/help.tsx`           | User manual; **public** (ADR 0009), in the sitemap          |
| API  | `/health`                 | `src/api/health.ts`            | Liveness; `database`: ok / not-configured / error           |
| API  | `/profile`                | `src/api/profile.ts`           | GET setup + equipment; PUT saves and makes routines         |
| API  | `/sessions`               | `src/api/sessions.ts`          | POST `{ routineId }` starts a workout (409 if one runs)     |
| API  | `/sessions/:id`           | `src/api/session.ts`           | GET the workout; DELETE discards it                         |
| API  | `/sessions/:id/ops`       | `src/api/session-ops.ts`       | POST `{ ops }`: set results, next exercise, finish          |
| API  | `/sessions/:id/keepalive` | `src/api/session-keepalive.ts` | POST every 4 min: keeps the sign-in alive                   |
| API  | `/photos`                 | `src/api/photos.ts`            | GET the person's photos (without images)                    |
| API  | `/photos/:id`             | `src/api/photo.ts`             | GET the image (owner only); DELETE                          |
| API  | `/photos/:kind/:period`   | `src/api/photo-upload.ts`      | PUT an image: `start/current`, `month/2026-09`, `year/2026` |

Platform hooks (`src/platform.ts`): `getStats` (profiles, routines, finished and running
workouts, catalogue size), `deleteUserData` (everything of the person, photos included; runs
on account deletion and unsubscribing) and `scheduled` (the monthly email, ADR 0014/0015).

## How it is built

- `src/lib/catalog.ts`: places, equipment and the 82 built-in exercises. The source of the seed
  migration (`src/lib/seed-sql.ts`).
- `src/lib/generator.ts`: routines from profile + place + equipment (pure, tested).
- `src/lib/progression.ts`: the next suggestion from the last workout (pure, tested).
- `src/lib/calories.ts`: MET-based calorie estimates (pure, tested).
- `src/lib/workout-state.ts`: the workout screen's ops, applied locally and queued (pure, tested).
- `src/lib/data.ts`: all queries; `src/lib/units.ts`: kg/lb, cm/ft + in, km/mi.
- `src/illustrations/`: stick-figure motions (`motions.ts`), the CSS-animated `StickFigure`, and
  the equipment and place icons (`icons.ts`).
- `src/lib/stats.ts`: calendar grouping, totals, streaks, feedback rules (pure, tested);
  `src/lib/progress.ts`: photos, calendar queries, improvements, monthly-report bookkeeping.
- `src/lib/monthly-email.ts`: the monthly email's content (tested); `src/lib/voice.ts`: voice
  choice and settings (tested).
- `src/illustrations/auto.ts`: automatic animations and icons for new exercises and equipment.
- `src/components/workout-view.tsx`: the workout screen (autosave, offline queue, timers,
  countdowns, voice, keep-alive, wake lock); `voice.tsx`: speaker and the mute/settings menu.

## Languages

English, German, Romanian and Hungarian (ADR 0011). Every route also exists under `/de`, `/ro`
and `/hu`. Texts: `src/i18n/screens.ts` (screens, errors) and `src/i18n/exercises.ts`
(exercise names and how-to texts, equipment, muscles); the catalog test in
`src/i18n/catalog.test.ts` also checks that every exercise and equipment has its texts.
Release notes: `CHANGELOG.md` plus `CHANGELOG.de.md`, `.ro.md`, `.hu.md`.

## Database

Own database `u962314563_workout` (ADR 0007), configured with `WORKOUT_DB_NAME`,
`WORKOUT_DB_USER`, `WORKOUT_DB_PWD` (optional `WORKOUT_DB_HOST`/`WORKOUT_DB_PORT`). Without them
the app says it is being set up. Schema: `db/migrations/`, applied with
`pnpm db:migrate --plugin workout` or in phpMyAdmin (select the workout database → Import, one
file after the other).

| File                        | Adds                                                                |
| --------------------------- | ------------------------------------------------------------------- |
| `0001_workout_setup.sql`    | `schema_migrations`                                                 |
| `0002_workout_tables.sql`   | Equipment, exercises, profiles, places, routines, workouts and sets |
| `0003_workout_seed.sql`     | The 16 kinds of equipment (with icons) and 82 exercises (GENERATED) |
| `0004_workout_progress.sql` | Progress photos, the monthly-email switch and sent-email log        |

`0003_workout_seed.sql` is generated from the catalogue: after changing `src/lib/catalog.ts` or
`src/illustrations/icons.ts`, run `UPDATE_SEED=1 pnpm --filter @devquake/plugin-workout test`.
Once a seed file has been applied anywhere, put catalogue changes in a new migration file and
point `SEED_MIGRATION` in `src/lib/seed-sql.ts` at it.

## Going live

The platform database already has the `workout` project (migration 0004, plugin id `workout`).

1. Merge to `main`; CI builds and Hostinger redeploys `devquake.com`.
2. Hostinger: create the subdomain `workout`, the DNS record if needed, the SSL certificate and
   `public_html/workout/.htaccess` (a copy of `public_html/shopping/.htaccess`; the
   `DEVQUAKE_ENV_FILE` line is the same). See the deployment guide, "App subdomains on
   Hostinger".
3. Database: add `WORKOUT_DB_NAME`, `WORKOUT_DB_USER`, `WORKOUT_DB_PWD` in hPanel →
   Environment variables **and** in `devquake.env` (the subdomain only reads that file), then
   apply `db/migrations/0001` to `0004` to `u962314563_workout`.
4. Restart the app subdomains: touch `hbuilds/current/nodejs/tmp/restart.txt`.
5. `/admin-cp/projects` → **Workout tracker**: tick **Public** and **Online**, save. Set the
   **NPS cost** if it should not be FREE (owner only).
6. Check: `https://workout.devquake.com/api/health` answers with JSON including
   `"database":"ok"` (401 when signed out); after subscribing, the app opens the setup wizard.

## Development

```bash
pnpm dev                                    # from the repo root
pnpm --filter @devquake/plugin-workout test
UPDATE_SEED=1 pnpm --filter @devquake/plugin-workout test   # rewrite the seed migration
```

Open `http://workout.lvh.me:3000` with `ROOT_DOMAIN=lvh.me:3000` so the DevQuake session is
shared with the app (plain `localhost` cookies are host-only).

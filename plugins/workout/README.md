# Workout tracker

DevQuake app served at `https://workout.devquake.com`. Product description and phases:
[docs/plugins/ideas/workout.md](../../docs/plugins/ideas/workout.md); decisions:
[ADR 0013](../../docs/adr/0013-workout-routines-and-guided-sessions.md) (routines, guided
workouts) and [ADR 0015](../../docs/adr/0015-workout-progress-voice-and-photos.md) (voice
coach, calendar, photos, monthly email).

**Status: 0.7.0.** A first visit opens a setup wizard: profile (birth year, height in cm or
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
progress photos per month and year compared with the fixed starting photo (step through the months, side by side or with a slider), a month-end photo reminder, and a monthly summary email.
People can also build their own routines and exercises, plan their week with reminders (ADR
0018, ADR 0019), and choose a Crazy coach. Profiles start at 6 years old. A user manual (`/help`,
the ? in the toolbar) explains all of it and is open to everyone.

Signing in is shared with DevQuake: the session cookie is set for `.devquake.com`, and the host
only lets the project's subscribers, assigned users and admins in (ADR 0006). The app itself
never asks for credentials.

## Routes

| Type | Pattern                                 | File                           | Purpose                                                                |
| ---- | --------------------------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| Page | `/`                                     | `src/pages/home.tsx`           | Dashboard; redirects to `/setup` without a profile                     |
| Page | `/setup`                                | `src/pages/setup.tsx`          | Setup wizard (profile, places, equipment)                              |
| Page | `/profile`                              | `src/pages/profile.tsx`        | Change profile, places, equipment; create routines again               |
| Page | `/routines/new`                         | `src/pages/routine-edit.tsx`   | Routine builder (`?from=<id>` starts from a copy)                      |
| Page | `/routines/:id`                         | `src/pages/routine.tsx`        | One routine: animations, how-to, sets; Start                           |
| Page | `/routines/:id/edit`                    | `src/pages/routine-edit.tsx`   | Edit an own routine                                                    |
| Page | `/plan`                                 | `src/pages/plan.tsx`           | Weekly plan: routines at times, every day or per weekday               |
| Page | `/exercises`                            | `src/pages/exercises.tsx`      | Own exercises                                                          |
| Page | `/exercises/new`, `/exercises/:id/edit` | `src/pages/exercise-edit.tsx`  | Own exercise form (automatic animation preview)                        |
| Page | `/workout/:id`                          | `src/pages/workout.tsx`        | The guided workout (full screen)                                       |
| Page | `/history`                              | `src/pages/history.tsx`        | Calendar: `?view=day\|month\|year&date=`, stats, photos                |
| Page | `/history/:id`                          | `src/pages/summary.tsx`        | Summary of a finished workout, improvements, feedback                  |
| Page | `/progress`                             | `src/pages/progress.tsx`       | Progress photos: fixed start vs. month by month; month-end reminder    |
| Page | `/help`                                 | `src/pages/help.tsx`           | User manual; **public** (ADR 0009), in the sitemap                     |
| API  | `/health`                               | `src/api/health.ts`            | Liveness; `database`: ok / not-configured / error                      |
| API  | `/profile`                              | `src/api/profile.ts`           | GET setup + equipment; PUT saves and makes routines                    |
| API  | `/sessions`                             | `src/api/sessions.ts`          | POST `{ routineId }` starts a workout (409 if one runs)                |
| API  | `/sessions/:id`                         | `src/api/session.ts`           | GET the workout; DELETE discards it                                    |
| API  | `/sessions/:id/ops`                     | `src/api/session-ops.ts`       | POST `{ ops }`: set results, next exercise, finish                     |
| API  | `/sessions/:id/keepalive`               | `src/api/session-keepalive.ts` | POST every 4 min: keeps the sign-in alive                              |
| API  | `/routines`                             | `src/api/routines.ts`          | POST an own routine `{ name, location, items }`                        |
| API  | `/routines/:id`                         | `src/api/routine.ts`           | PUT / DELETE an own routine (not suggested ones)                       |
| API  | `/plan`                                 | `src/api/plan.ts`              | POST a slot `{ routineId, weekday, start, duration }` (409 on overlap) |
| API  | `/plan/:id`                             | `src/api/plan-entry.ts`        | PUT / DELETE a slot                                                    |
| API  | `/plan.ics`                             | `src/api/plan-calendar.ts`     | GET the plan as a calendar file (alarms for reminders)                 |
| API  | `/exercises`                            | `src/api/exercises.ts`         | POST an own exercise                                                   |
| API  | `/exercises/:id`                        | `src/api/exercise.ts`          | PUT / DELETE an own exercise (409 while a routine uses it)             |
| API  | `/photos`                               | `src/api/photos.ts`            | GET the person's photos (without images)                               |
| API  | `/photos/:id`                           | `src/api/photo.ts`             | GET the image (owner only); DELETE                                     |
| API  | `/photos/:kind/:period`                 | `src/api/photo-upload.ts`      | PUT an image: `start/current`, `month/2026-09`, `year/2026`            |
| API  | `/voice`                                | `src/api/voice.ts`             | GET `?text=&gender=&style=`: a coach sentence as MP3 (503 if off)      |

Platform hooks (`src/platform.ts`): `getStats` (profiles, routines, finished and running
workouts, catalogue size), `deleteUserData` (everything of the person, photos included; runs
on account deletion and unsubscribing) and `scheduled` (the monthly email and plan reminders, ADR 0014/0015/0019).

## How it is built

- `src/lib/catalog.ts`: places, equipment and the 82 built-in exercises. The source of the seed
  migration (`src/lib/seed-sql.ts`).
- `src/lib/generator.ts`: routines from profile + place + equipment (pure, tested).
- `src/lib/progression.ts`: the next suggestion from the last workout (pure, tested).
- `src/lib/photos.ts`: accepted files, photo periods, the month-photo window (last 3 days of a
  month, and last month during the first 7 days) and the comparison series (pure, tested).
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

| File                                           | Adds                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| `0001_workout_setup.sql`                       | `schema_migrations`                                                 |
| `0002_workout_tables.sql`                      | Equipment, exercises, profiles, places, routines, workouts and sets |
| `0003_workout_seed.sql`                        | The 16 kinds of equipment (with icons) and 82 exercises (GENERATED) |
| `0004_workout_progress.sql`                    | Progress photos, the monthly-email switch and sent-email log        |
| `0005_workout_plan.sql`                        | The weekly plan (`plan_entries`)                                    |
| `0006_workout_reminders_and_own_exercises.sql` | Plan reminders, time zones, own exercises' descriptions             |
| `0007_voice_clips.sql`                         | Cached audio of the natural coach voices (`voice_clips`)            |

### Natural coach voices

The voice coach speaks with Microsoft Azure neural voices (`src/lib/tts.ts`: an adult man and a
woman per language, e.g. ro-RO Emil / Alina; SSML prosody makes the male voice a little crisper).
Set `WORKOUT_TTS_KEY` and `WORKOUT_TTS_REGION` (an Azure **Speech** resource, e.g. region
`westeurope`). Without them the setting is hidden and the device's own voices speak (Web Speech).
`GET /api/voice` generates a sentence once, stores the MP3 in `voice_clips` (shared by everyone,
no user id) and serves it from there afterwards; the browser also caches it for 30 days. New
sentences are limited to 40 per person per minute; clips unused for 180 days are removed by the
scheduled job. Cost: the coach's sentences are templates with exercise names and numbers, so the
cache soon covers nearly all of them; the Azure free tier (0.5 million characters a month) should
cover normal use, beyond it neural voices cost about $16 per million characters. Privacy: the
sentence text (exercise names, numbers, never who is training) is sent to Azure.

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
   apply `db/migrations/0001` to `0007` to `u962314563_workout`. Optional: `WORKOUT_TTS_KEY`
   and `WORKOUT_TTS_REGION` for the natural coach voices (same two places).
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

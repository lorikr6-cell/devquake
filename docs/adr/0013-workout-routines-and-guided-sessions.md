# 0013 — Workout app: generated routines, guided sessions and autosave

- Status: Accepted
- Date: 2026-09-25

## Context

The `workout` app (placeholder 0.1.1) changes direction. It was going to be a set-by-set log
with leaderboards. It becomes a personal coach: it builds routines from the user's profile and
training place (Gym, Home with owned equipment, Outside), guides them through a workout on their
phone, suggests repetitions, records what they actually did and times every exercise. Product
description: [docs/plugins/ideas/workout.md](../plugins/ideas/workout.md).

Constraints: plugin rules (own database with `ctx.db`, ADR 0007; UTC timestamps, ADR 0010; four
languages, ADR 0011), mostly phone use, gyms with poor signal, and no photos of people (GDPR).
Health-related data should be kept to a minimum.

## Decision

1. **Metric storage, converted display.** Weight is stored in kg, height in cm and distance in
   metres. The profile keeps two preferences, `weight_unit` (kg | lb) and `height_unit`
   (cm | ft); distances follow the height choice (cm → km, ft → miles). Forms and pages
   convert with `src/lib/units.ts` (1 lb = 0.45359237 kg, 1 in = 2.54 cm), which is
   unit-tested. The imperial height input is ft + in.
2. **Catalogue in the database, generated from code; texts in the catalogue files.**
   `src/lib/catalog.ts` lists the equipment (16 items) and the built-in exercises (82): movement
   pattern, metric (reps | time | distance), equipment needed (all of it), places, difficulty
   1–3, low impact, weighted, seconds per repetition, speed (distance exercises), MET value,
   muscles, animation and hand prop. `src/lib/seed-sql.ts` turns it into the seed migration
   `db/migrations/0003_workout_seed.sql`: `equipment` rows **with their SVG icon**
   (`icon_svg`), `exercises` rows (`user_id` NULL, stable `slug`) and `exercise_equipment`. The
   upserts are keyed on the slug and can be run again. Exercises that leave the catalogue are
   retired (`retired_at`), never deleted, because routines and workouts point at them. At
   runtime the app reads the catalogue and the icons from the database. `seed.test.ts` fails
   when the migration file differs from the code; `UPDATE_SEED=1` rewrites it. A later change
   of the catalogue gets a new migration file, because a database runs each file only once.
   Names and how-to texts are **not** in the database: they are in `src/i18n/exercises.ts`
   (`exercises.<slug>`, `equipment.<slug>`, `muscles.<m>`) in en/de/ro/hu, so the catalogue
   test checks them like every other text.
3. **Illustrations are our own SVG drawings, animated with CSS.** Equipment and place icons are
   24 × 24 line drawings in `src/illustrations/icons.ts`. They are rendered from our own
   markup only, never from user input, and a test rejects scripts and event handlers in them.
   Exercises are stick figures (`src/illustrations/motions.ts`): a skeleton of straight bones
   on a 100 × 100 grid. Each motion has two poses, given as the pelvis position and the angle
   of every bone. `StickFigure` draws every bone as a nested SVG `<g>` rotated about its joint.
   Each group carries its transform for both poses in CSS variables, and a single `@keyframes`
   swings between them. The animation is pure CSS: no JavaScript, and no CSS path (`d`)
   animation, which Safari does not support. Props (dumbbell, kettlebell, barbell plate) and
   scenery (bench, bar, box, wall, machines) are simple shapes. Figures draw in
   `currentColor`, so they work in both themes. With `prefers-reduced-motion`, on the
   dashboard and in the summary, they stand still. No images are downloaded or generated from
   photos.
4. **The routine generator is a pure function.** `generateRoutines` in `src/lib/generator.ts`
   returns three routines per place. Gym and home get full body, upper body, and legs and core.
   Home is limited to the owned equipment and falls back to body weight, with at least four
   main exercises. Outside gets a brisk walk, intervals and a park workout. Every routine
   starts with a warm-up (2–3 timed exercises; outside also an easy walk). The routine is
   filled from movement-pattern slots. Sets, repetition ranges and rests come from a table
   keyed by goal and experience. People over 60 get difficulty ≤ 2 and 30 s more rest.
   `low_impact` removes jumping and running (walking replaces running outside). Weight loss
   and endurance goals add a 10-minute cardio finisher. Main exercises are dropped from the end
   until the estimate fits `session_minutes`. The same input always gives the same routines, so
   they are unit-tested and can be generated again after a profile change. Generated routines
   are normal rows (`source = 'generated'`, `template` key). Generating again archives the
   previous generated routines of that place; past workouts stay.
5. **Progression is also a pure function.** `nextTarget` in `src/lib/progression.ts` uses
   double progression: +1 repetition while below `reps_max`. At `reps_max` in every set it goes
   back to `reps_min` with more weight (+2.5 kg on a barbell or machine, +1 kg on dumbbells or a
   kettlebell). More than 20 % short lowers the target by one repetition. Holds grow by 5 s (by
   10 % above a minute), distances by 10 %. Starting a workout computes each exercise's target
   from its last finished workout and stores it on the workout item (`session_items.target_*`),
   so history shows what was suggested that day.
6. **Calories are an estimate.** kcal = MET × body weight × hours (`src/lib/calories.ts`). The
   working time uses the exercise's MET; the rest of the time spent on the exercise counts as
   standing rest (MET 1.5). Routine cards show a planned estimate. A finished workout stores
   its estimate from the sets done and the times measured, using the body weight saved when
   it started. Pages always show calories as "≈".
7. **Workouts are recorded on the server and replayed on the phone.**
   - `POST /api/sessions` copies the routine's exercises into `session_items` with today's
     targets and starts the first one. Later changes to the routine do not change a workout.
     Only one workout per person can be `active`.
   - The workout screen changes nothing through the network directly. It creates **ops**:
     `set` (a set's values, optionally done), `next` (end this exercise, start the next, or
     finish after the last) and `finish`. It applies them to its own state at once
     (`src/lib/workout-state.ts`) and sends them in order to `POST /api/sessions/:id/ops`.
     Every op can be applied twice: a set keeps the values with the newest `client_at`, an
     exercise ends only once, and a finished workout ignores later ops.
   - Every op carries the moment it happened on the **server's clock**; the phone corrects its
     clock with the server time it received. The server accepts that time when it lies
     between the exercise's start and now, and uses its own clock otherwise
     (`clampTime`). An op sent late (offline) therefore still records the right times.
   - Discarding (`DELETE /api/sessions/:id`) deletes the workout with everything in it.
8. **Autosave with 10 seconds of quiet.** A typed value is saved as a `set` op 10 s after
   the last change or focus change. It is saved at once on "Set done", when the page is hidden
   and on `pagehide` (`navigator.sendBeacon`, which is why the ops endpoint is a POST). Ops
   waiting to be sent are kept in `localStorage` (`dq-workout:<sessionId>`). They are sent
   again on `online`, every 15 s, and when the page is opened again. A newer autosave of the
   same set replaces an older one in the queue. Storage errors are caught; the server stays
   the source of truth.
9. **Phone-first workout screen.** It covers the whole screen, including the app's toolbar.
   The top shows the total time, the progress and Stop. The exercise's moving figure fills
   the space behind its name, clearly visible. At the bottom is one control: a large ± stepper
   with the suggestion prefilled (plus weight for weighted exercises), a countdown for timed
   exercises that ends the set by itself, or a stopwatch and distance for walks and runs. One
   main button sits within thumb reach. Touch targets are at least 44 px. A rest countdown
   (skip, +15 s) follows each set. After the last set the next exercise starts by itself, and
   after the last exercise the workout finishes and the summary opens. The screen stays on
   with `navigator.wakeLock` where supported.
10. **Personal data is minimal and deletable.** The profile stores the birth year, not a birth
    date, and no sex or medical conditions; only `low_impact` is kept, as a preference.
    `deleteUserData` in `src/platform.ts` deletes the person's workouts, routines (their items
    and sets go by cascade), places, equipment, profile and own exercises in one transaction.
    `getStats` reports profiles, routines, finished and running workouts, and the catalogue
    size.

## Consequences

- Positive: the generator, progression, calories and workout state are plain functions that
  are tested on their own and can change without touching the UI.
- Positive: the illustrations are small, drawn for this app and work in both themes, so they
  raise no licence or GDPR questions. A workout survives a lost connection, a reload or a
  locked phone.
- Positive: all texts, including exercise names, go through the checked catalogues, so no
  exercise can appear in only one language.
- Negative: 82 exercises × 4 languages × (name + how-to) have to be kept in sync. The stick
  figures are abstract, and some movements (band pull-apart, leg press) only hint at the
  motion.
- Negative: adding an exercise touches the catalogue, the texts and possibly a motion, and
  needs a new seed migration once released; the tests catch any gap.
- Negative: the migrations were written without a MySQL instance at hand. They follow the
  shopping app's patterns but must be run once on a development database before release.
- Follow-up: the routine builder, the history list, per-exercise progress and own exercises
  (phase 2), then leaderboards (later).

## Alternatives considered

- **Import exercises from wger.de or free-exercise-db.** Rejected for now: CC-BY-SA
  attribution and share-alike (wger), photos of people (free-exercise-db), uneven
  translations. An import script can be added later if the curated catalogue is too small.
- **Exercise names in database columns per language.** Rejected: they would not be covered by
  the catalogue test that ADR 0011 relies on.
- **Downloaded illustrations or GIFs.** Rejected: unclear licences and file size; the brief
  asks for abstract figures.
- **Animating with JavaScript (`requestAnimationFrame`) or CSS path animation.** Rejected:
  JavaScript would run on every figure on every frame. CSS `d` animation does not work in
  Safari. Rotated SVG groups animate in every browser for free.
- **Only the client keeps time and sends everything at the end.** Rejected: a closed tab or a
  flat battery would lose the workout, which is exactly what the 10-second autosave is for.
- **Store what the user typed (lb, ft).** Rejected: every calculation would need the unit;
  converting at the edges keeps the maths in one unit.

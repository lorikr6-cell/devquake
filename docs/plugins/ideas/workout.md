# Idea: Personal workout coach (`workout`)

Status: **0.4.0 built** ( [plugins/workout](../../../plugins/workout/README.md)) ·
Subdomain: `workout.devquake.com` · Decisions: [ADR 0013](../../adr/0013-workout-routines-and-guided-sessions.md)

## Summary

The app works around each user. From their profile (age, height, weight, experience, goal) and
where they train (**Gym**, **Home** with the equipment they own, **Outside**) it builds routines
for them. It then guides them through a workout one exercise at a time. Each exercise is called
a "workout mode" in the original brief. For every set the app suggests the number of
repetitions, and the user enters how many they actually did. The app times the whole workout and
each exercise, moves on by itself when all sets are done, and ends the workout after the last
exercise. The results feed the next suggestions.

It is designed for phones first: during a workout the screen shows one exercise, one number and
one large button.

## Users and access

| Role   | Can                                                                             |
| ------ | ------------------------------------------------------------------------------- |
| Member | Profile, locations and equipment, generated and own routines, workouts, history |
| Admin  | Same; `/admin-cp` shows usage numbers (`getStats`)                              |

Access is decided by the host (subscribers, assigned users, admins; ADR 0006). There are no
public pages.

## User journey

1. **First visit → setup** (a short wizard, one question per screen):
   1. Profile: birth year, height (cm, or ft + in), weight (kg or lb), experience (beginner,
      intermediate, advanced), goal (strength, muscle, endurance, general fitness, weight loss),
      workouts per week, minutes per workout, and "prefer low-impact exercises" (for sore joints
      or high body weight). Units can be switched on each field and are remembered.
   2. Where do you train? Any of **Gym**, **Home**, **Outside**.
   3. Home only: tick the equipment you own (can be changed later).
   4. The app creates **3 routines for each chosen place**, each starting with a warm-up, and
      opens the dashboard. Every routine shows its estimated time and calories.
2. **Dashboard** (the default screen): routines grouped by place, each with a **Start**
   button; the last workouts; this week's count and time; links to profile and equipment. A
   workout that was left unfinished is offered first ("Continue").
3. **Workout** (see below) → **summary**: total time, time per exercise, an estimate of the
   calories, repetitions done compared with the suggestion, and the suggestion for next time.
4. **Own routines**: build a new routine or copy and change a generated one: pick exercises
   (filtered by place and equipment), sets, repetitions or time, and rest. Generated routines
   can be created again after the profile or equipment changes.

## The guided workout (phone screen)

```text
┌──────────────────────────┐
│ 12:47          2 / 6  ✕  │  total time · exercise 2 of 6 · stop
│                          │
│      [stick figure]      │  animated illustration
│   Dumbbell row           │
│   Set 2 of 3             │
│                          │
│   Suggested: 10          │
│   ┌───┐  ┌────┐  ┌───┐   │
│   │ − │  │ 10 │  │ + │   │  prefilled with the suggestion
│   └───┘  └────┘  └───┘   │
│   Weight  [ 12.5 kg ]    │  weighted exercises only
│                          │
│  ┌────────────────────┐  │
│  │     Set done ✓     │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

- **Set done** → rest countdown (can be skipped) → next set. After the last set the next
  exercise starts by itself. After the last exercise the workout ends and the timer stops.
- Timed exercises (plank, walk, run) show a countdown or stopwatch instead of the counter; the
  user confirms the time and, outside, the distance.
- **Timing**: the workout's start and end, and each exercise's start and end (from the moment it
  is shown until the moment the app moves on). Rest time is part of the exercise's time.
- **Autosave**: a changed number is saved once the field has been left alone for **10 seconds**,
  and always right away on "Set done", on leaving the page and when the phone locks. The
  workout also keeps a copy on the phone until the server confirms, so nothing is lost in a gym
  basement with no signal.
- The exercise's animated stick figure fills the space behind its name, large and clearly
  visible, so the movement can be followed at a glance; a "?" shows the how-to text.
- The screen stays on during a workout (Wake Lock API, where supported).
- Reloading or reopening the app goes back to the running workout.

## Suggestions

- **First time** (the generator): sets and repetitions come from the goal and experience, for
  example strength 4 × 5–6, muscle 3–4 × 8–12, endurance 2–3 × 15–20; beginners do one set
  less; people over 60 or who prefer low impact get easier exercises and longer rests.
- **After that** (progression, per exercise): if every set reached the suggestion, suggest one
  more repetition. When the top of the range is reached, suggest the bottom of the range with a
  little more weight (+2.5 kg, or +1 kg for dumbbells) or a harder variation. If the user fell
  short by more than 20 %, keep the suggestion or lower it. Timed exercises move in 5–10 second
  steps, and walks and runs in distance or pace.
- Results shown to the user: time per exercise, total repetitions and volume, repetitions
  compared with the suggestion, a trend per exercise and personal bests.

## Exercise catalogue

- **82 built-in exercises** (8 warm-ups, body weight, core, pull-up bar, dumbbells, kettlebell,
  barbell, bands, gym machines, cardio machines and outdoor walks and runs). They are written
  to the app's database by a migration generated from `src/lib/catalog.ts`. Each has: what it
  measures (repetitions, time or distance), muscles, the equipment it needs, the places it
  fits, difficulty, low impact or not, seconds per repetition and a MET value (for time and
  calorie estimates).
- **16 kinds of equipment**, each stored in the database with its own small SVG icon (drawn
  for this app). Home list: dumbbells, kettlebell, barbell and plates, squat rack, bench,
  pull-up bar, resistance bands, jump rope, step or box, treadmill, exercise bike, rowing
  machine. The gym also has a cable machine, leg press, leg curl and extension machines and a
  chest press. Outside means no equipment.
- Names and short how-to texts in all four languages (ADR 0011).
- **Illustrations**: our own SVG stick figures, animated with CSS between two poses (57
  motions shared by the exercises), with simple props and scenery (dumbbells, bench, bar,
  machines). No photos of people (GDPR) and no images taken from other sites. With reduced
  motion turned on, the figure stays still.

## Data model (details in ADR 0013 and `db/migrations/0002_workout_tables.sql`)

- `equipment` (slug, sort_order, home, icon_svg)
- `exercises` (id, slug, user_id NULL for built-in, name for own exercises, role, pattern,
  metric, places, muscles, difficulty, low_impact, weighted, seconds_per_rep, speed_mps, met,
  motion, prop, retired_at) · `exercise_equipment` (exercise_id, equipment_slug)
- `profiles` (user_id, birth_year, height_cm, weight_kg, weight_unit, height_unit, experience,
  goal, days_per_week, session_minutes, low_impact)
- `user_locations` (user_id, location) · `user_equipment` (user_id, equipment_slug)
- `routines` (id, user_id, location, source generated/custom, template, name, archived_at)
- `routine_items` (routine_id, position, phase warmup/main, exercise_id, sets, reps_min,
  reps_max, target_reps, seconds, distance_m, rest_seconds)
- `sessions` (id, user_id, routine_id, location, template, body_weight_kg, status
  active/finished, started_at, finished_at, kcal)
- `session_items` (session_id, position, phase, exercise_id, sets, targets, rest_seconds,
  started_at, ended_at)
- `session_sets` (session_item_id, set_no, reps, seconds, distance_m, weight_kg, done_at,
  client_at)

All weights and lengths are stored in kg, cm and metres, and converted only for display (ADR
0013). All timestamps are stored in UTC (ADR 0010).

## Routes

Built in 0.2.0:

| Pattern                 | Page or API                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `/`                     | Dashboard (the setup wizard when there is no profile)        |
| `/setup`                | Setup wizard                                                 |
| `/profile`              | Profile, units, places, equipment; create the routines again |
| `/routines/:id`         | A routine with its animations and how-to texts, Start        |
| `/workout/:id`          | The guided workout                                           |
| `/history/:id`          | Summary of one workout                                       |
| `/api/profile`          | GET / PUT profile, places, equipment (creates the routines)  |
| `/api/sessions`         | POST start a workout from a routine                          |
| `/api/sessions/:id`     | GET the workout, DELETE discard it                           |
| `/api/sessions/:id/ops` | POST the workout screen's changes in order (safe to repeat)  |

Planned: `/routines/new` (routine builder), `/history` (all workouts), `/exercises/:id`
(progress for one exercise), `/api/routines`.

## Phases

1. **0.2.0 Guided workouts** (built): profile and units, places and equipment, the exercise
   catalogue with animations and equipment icons, 3 generated routines per place with a
   warm-up, time and calorie estimates, the guided workout with timing, autosave, offline
   queue and auto-advance, the summary with calories and progression for the next workout,
   `deleteUserData`.
2. **0.3.0 Coach and progress** (built, ADR 0015): voice coach with mute and speech settings,
   countdowns and encouraging lines, repetitions scaled by exercise complexity, automatic
   illustrations for new exercises, a day/month/year calendar with statistics and
   improvements, progress photos (start, month, year) with before and after, the monthly
   summary email, and the sign-in kept alive during workouts.
3. **0.4.0 User manual** (built): a public `/help` page in the four languages.
4. **0.5.0 Own routines**: the routine builder and own exercises, a page per exercise with
   its trend.
5. **Later**: reminders, GPS distance for outdoor runs, a
   cool-down in every routine, leaderboards (opt-in, per exercise, as in the first version of
   this idea).

## Privacy and safety

- Only what the suggestions need is stored: the birth year, not the full birth date; no sex and
  no medical data. Everything is deleted by `deleteUserData` (account deletion and
  unsubscribing).
- A short note in setup and on the dashboard: the suggestions are general guidance, not medical
  advice.
- Calories are always shown as an estimate ("≈").

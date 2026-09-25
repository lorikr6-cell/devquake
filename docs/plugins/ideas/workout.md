# Idea: Workout tracker with leaderboards (`workout`)

Status: **scaffolded** (placeholder 0.1.0, [plugins/workout](../../../plugins/workout/README.md)) · Subdomain: `workout.devquake.com`

## Summary

Users log their workouts set by set and see their progress. Leaderboards per exercise and across
all workouts encourage users to beat their own and others' results.

## Users and access

| Role   | Can                                                               |
| ------ | ----------------------------------------------------------------- |
| Guest  | View public leaderboards                                          |
| Member | Log workouts, see history and records, join leaderboards (opt-in) |
| Admin  | Manage the exercise catalogue, moderate leaderboard entries       |

## Core features (MVP)

1. **Exercise catalogue**: name, category (strength, bodyweight, cardio), and which metrics it
   uses (reps, weight, duration, distance). Users can add custom exercises.
2. **Workout logging**: a workout has a date and sets; each set has an exercise and its metrics.
   Quick "repeat last workout" and "add set like previous".
3. **History and progress**: per exercise, charts of best set, volume and estimated one-rep max.
4. **Personal records**: automatic detection and a badge when a record is beaten.
5. **Leaderboards**:
   - per exercise (for example max reps of push-ups, heaviest squat, fastest 5 km);
   - overall (points across all workouts);
   - periods: this week, this month, all time.
6. **Privacy**: leaderboards are opt-in; users choose a display name.

### Leaderboard metrics (proposal)

| Exercise type | Ranked by                                       |
| ------------- | ----------------------------------------------- |
| Weighted      | Heaviest single set, or estimated one-rep max   |
| Bodyweight    | Most reps in one set, or total reps in a period |
| Timed         | Longest duration (for example plank)            |
| Distance      | Fastest time for a set distance                 |
| Overall       | Points from volume and consistency              |

## Later

- Streaks, weekly goals and reminders.
- Friends and private groups with their own leaderboards.
- Templates and programmes.
- Bodyweight-relative rankings for fairness.
- Result verification (for example video link) for top leaderboard spots.

## Data model (sketch)

- `Exercise` (id, name, category, metrics, createdBy)
- `Workout` (id, userId, date, notes) · `Set` (id, workoutId, exerciseId, reps, weight,
  durationSec, distanceM, order)
- `PersonalRecord` (userId, exerciseId, metric, value, setId, achievedAt)
- `LeaderboardEntry` (board, period, userId, value, rank) as a computed or cached view

## Routes (sketch)

| Pattern                   | Page or API                     |
| ------------------------- | ------------------------------- |
| `/`                       | Today, recent workouts, records |
| `/log`                    | Log a workout                   |
| `/history`                | Workout history                 |
| `/exercises/:id`          | Exercise progress and records   |
| `/leaderboards`           | Overall leaderboards            |
| `/leaderboards/:exercise` | Leaderboard for one exercise    |
| `/api/workouts`           | Create and list workouts        |

## Platform capabilities needed

Accounts, database, scheduled jobs (recompute leaderboards), optionally push for reminders.

## Open questions

- How are overall points calculated so that different exercise types are comparable?
- How are obviously fake results handled on public leaderboards?

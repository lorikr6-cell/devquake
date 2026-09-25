# 0018 — Workout app: own routines and a weekly plan

- Status: Accepted
- Date: 2026-09-26

## Context

The workout app suggests three routines per place (ADR 0013). People also want routines of
their own, and to plan when they train: every day or per weekday, sometimes several workouts a
day, without two planned at the same time.

## Decision

1. **Own routines** are `routines` rows with `source = 'custom'` (the column existed since
   0.2.0). The builder (`/routines/new`, `/routines/:id/edit`) picks built-in exercises for the
   routine's place, in any order, each with sets, repetitions (a range), seconds or distance,
   warm-up or main phase, and rest. New exercises start with the generator's suggestion for the
   person (`prescribe`). Input is validated by `routineInput` (pure, tested): known exercises for
   the place, only the fields of the exercise's metric, at most 30 exercises, 50 own routines.
   Only own routines can be edited or deleted; suggested ones can be copied ("Make my own
   version", `?from=<id>`). "Create my routines again" never touches own routines. Deleting one
   removes its plan slots (foreign key); past workouts keep their copy and name.
2. **The plan** (`plan_entries`, migration 0005): a routine at a start time with a length
   (default: the routine's estimate rounded up to 5 minutes), every day (`weekday` NULL) or on a
   weekday (1 = Monday). Several per day are allowed; **overlaps are not**: two slots overlap
   when they share a day and their times intersect (touching is fine; an every-day slot is on
   every weekday). The page checks while typing and names the slot in the way; the server checks
   again in a transaction with the person's slots locked (`savePlanEntry`, 409). Slots end by
   midnight. Times are wall-clock minutes in the person's time zone, not timestamps (ADR 0010
   covers moments; "Mondays at 07:30" stays 07:30 across daylight-saving changes).
3. **Today.** The home screen shows today's slots (the weekday in the person's time zone) with
   a Start button. Regenerating suggestions moves slots to the new suggested routine with the
   same template, or removes them when there is none.
4. Everything is scoped to the user and removed by `deleteUserData` (plan entries, routines).

## Consequences

- Positive: plans and own routines survive regeneration; overlap rules are pure and tested.
- Negative: no reminders yet (the plan is shown in the app only); a slot cannot cross midnight.

## Alternatives considered

- **Storing plan times as UTC timestamps.** Rejected: a weekly time of day would shift by an
  hour twice a year and when travelling.
- **Separate "daily" and "weekly" plans.** Rejected: one list where each slot is every day or on
  a weekday covers both and makes the overlap rule simple.

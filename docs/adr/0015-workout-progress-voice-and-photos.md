# 0015 — Workout app: voice coach, calendar, progress photos and monthly email

- Status: Accepted
- Date: 2026-09-25

## Context

After the guided workouts (ADR 0013), the workout app should keep people going: a voice
during workouts, feedback, a calendar of results, photos to see their transformation, and a
monthly summary. The phone-first rules of ADR 0013 still apply, as do the four languages (ADR
0011). Photos of people's bodies are personal data and must stay private.

## Decision

1. **Illustrations are automatic for new exercises.** An exercise without its own animation
   gets one from its movement pattern and equipment (`src/illustrations/auto.ts`, e.g. a
   `push_h` exercise with a bench → bench press), and a hand prop from its equipment.
   Equipment without a drawn icon gets a generated badge with its initials. 49 of the 82
   built-in exercises already rely on this.
2. **Repetitions follow complexity.** `complexity = difficulty + pattern load` (pull-ups +1,
   calf raises −1…) scales the goal's repetition range: ×1.4 at complexity 0, ×1 at 2, ×0.6
   at 4 (half as much for weighted exercises, whose weight adapts anyway). Holds scale the
   same way (`repScale` in `src/lib/generator.ts`).
3. **Voice coach with the browser's speech synthesis** (Web Speech API; no audio files, no
   server). The phone speaks the app's own texts (`voice.<style>.*`, four languages) in the
   page language. Settings are per device (`localStorage`): muted, a female or male voice
   (picked by name from the device's voices for the language, `pickVoice`), and a calm, normal
   or motivational style (its own texts plus speed and pitch). The mute button and the settings
   are in the app toolbar and in the workout screen. Encouraging lines (`motivation.*`) show
   during rests. The voice says:
   - a get-ready countdown before the first exercise and before every timed set;
   - 3-2-1-go at the end of every rest;
   - "set done", the rest length and the next exercise;
   - the last set, halfway and ten seconds left in holds, and beating the target;
   - the end of the workout.
4. **Calendar** (`/history`, `?view=day|month|year&date=`). Workouts are grouped by the
   viewer's day (ADR 0010) from a UTC window one day wider than the period. The month and
   year views colour days by minutes trained (one hue, light to dark, with a legend and
   tooltips). They show totals, the longest streak and a comparison with the period before.
   The day view shows each workout with what improved since the last time and personal
   records (`improvements` in `src/lib/progress.ts`). Short feedback lines are chosen by rules
   (`feedbackKey`, `dayFeedbackKey`), and the summary after a workout uses the same ones.
5. **Progress photos** (`progress_photos`, migration 0004): an optional starting photo (in the
   setup wizard, taken with the camera or chosen; replaceable on the profile page) and one per
   month and per year (calendar and `/progress`), with a before-and-after slider. They are
   shrunk in the browser (1440 px), checked by content (JPEG, PNG, WebP, at most 3 MB), stored
   as blobs in the app's own database, served only to their owner (`private` caching,
   `nosniff`, a restrictive CSP), deleted by the delete button and by `deleteUserData`.
6. **Monthly email** through the platform (ADR 0014). The `scheduled` hook runs after 12:00
   UTC on the 1st, when the month has ended in every time zone. It emails everyone with a
   profile and `monthly_email` on (default on; switch in the setup wizard and the profile):
   last month's numbers, an encouraging line, a reminder to add the month's photo, a link to
   that month's calendar and how to turn the email off. The email's days are UTC days. A
   `monthly_reports` row is written before sending, so each person gets each month once; 25
   emails per run.
7. **The sign-in stays alive during a workout.** The workout screen calls
   `POST /api/sessions/:id/keepalive` every 4 minutes while visible. This keeps the idle timer
   fresh, and while that workout is running and the sign-in ends within two hours, it extends
   it (ADR 0014, at most 24 hours after signing in). If the sign-in ends anyway (401), the
   workout keeps its changes on the phone and offers a sign-in link.

## Consequences

- Positive: new exercises and equipment are illustrated without extra work. The voice needs
  no downloads and works offline.
- Positive: all feedback is rule-based and translated, so it is predictable and testable.
- Negative: speech quality and the available voices depend on the device. Some devices have no
  voice for Romanian or Hungarian (the browser's default is used), and gender is guessed from
  voice names. Browsers only speak after the person has tapped something on the page. A
  workout reopened by a reload stays silent until the first tap.
- Negative: photos in MySQL make the database larger (a few hundred KB per photo). Fine at this
  scale; object storage would be the next step.
- Negative: the monthly email uses UTC months, which can differ from a person's local month
  by a few hours at its edges.

## Alternatives considered

- **Recorded or server-generated voices (cloud text-to-speech).** Rejected for now: cost,
  files per phrase and language, and sending texts to a third party. The browser's voices
  are free and private.
- **Storing voice settings in the profile.** Rejected: speakers, headphones and voices differ
  per device, so a per-device setting fits better.
- **Photos on the file system.** Rejected: the managed hosting's deploys replace the app
  folder; the database already has backups and GDPR deletion.

## Follow-up: start versus month by month (workout 0.9.0)

- The comparison on **Progress** keeps the starting photo fixed (the oldest photo when there is
  none) and steps through the other photos, oldest to newest, with ‹ ›, the arrow keys or a
  swipe; side by side, or on top of each other with a slider. It replaces the two drop-downs.
- In the last 3 days of a month without a month photo, the home screen and **Progress** ask for
  it. During the first 7 days of a month, last month’s photo can still be added from
  **Progress** when it is missing. Days are the person's own (`ctx.timeZone`). Logic:
  `monthPhotoWindow` and `comparisonSeries` in `lib/photos.ts`. No schema change: one photo per
  month was already stored.

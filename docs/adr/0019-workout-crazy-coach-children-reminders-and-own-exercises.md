# 0019 — Workout app: crazy coach, children, reminders and own exercises

- Status: Accepted
- Date: 2026-09-26

## Context

Requests after 0.6.0 (ADR 0018): a male voice that really sounds male and a fiercer coaching
style; profiles for children from 6 years old; reminders for the plan; exercises people make
themselves; and a workout screen that fits a tablet held sideways.

## Decision

1. **Voice.** A fourth style, **Crazy**, with two text sets chosen by the voice: `crazyMale` (an
   army drill sergeant / brawler) and `crazyFemale` (a bossy boss). They cover every moment the
   coach speaks (get ready, go, set done, beat the target, rest, next, last set, halfway, ten
   seconds, workout done) and the encouragements during rests, and stay motivating rather than
   insulting. `voiceTextSet(settings)` picks the set, `voiceTuning` the speed and pitch. Browsers
   often have only one voice for a language (Romanian and Hungarian on iPads: a female one), so
   when the chosen gender is missing the coach **makes one**: a pitch of ×0.55 for male (×1.4
   for female), since no speech engine in the browser can create a new voice.
2. **Children.** Profiles from 6 years old (`MIN_AGE`; heights from 90 cm, weights from 15 kg).
   Age groups (`ageGroup`): children 6–9 get difficulty 1, at most 2 sets and shorter holds;
   preteens 10–12 difficulty up to 2 and at most 3 sets; both only body-weight exercises (no
   weighted exercises). The setup says people under 16 should train with an adult nearby.
3. **Reminders.** A plan slot may have a reminder: at the start or 10, 30 or 60 minutes before
   (`plan_entries.remind_minutes`). The `scheduled` hook sends an email between the reminder time
   and the start, in the person's time zone (`profiles.time_zone`, kept from their visits), once
   per slot and day (`plan_reminders`, claimed before sending). Reminders before 00:xx workouts
   are sent the evening before. To make this timely, the host runs apps' scheduled work every
   **5 minutes** (was hourly; ADR 0014). `GET /api/plan.ics` downloads the plan as a calendar
   file (floating local times, daily or weekly repeats, an alarm per reminder), so phones can
   remind natively too.
4. **Own exercises.** `exercises` rows with the person's `user_id`, their name and an optional
   description (`how_to`), and the slug `u<id>`. Kind, movement pattern, measurement, places,
   equipment, muscles, difficulty, weighted and low impact are chosen in a form; time and
   calorie values are derived (`exerciseInput`, tested). The animation is automatic
   (`autoMotion`), previewed live. They appear under "Mine" in the routine builder. Names go
   through `exerciseName()` everywhere (translations for built-in exercises). The measurement
   cannot change once used; an exercise in a routine cannot be deleted; one used only in past
   workouts is hidden (`retired_at`) so the history keeps its name.
5. **Workout screen.** It is exactly as tall as the visible area (`100dvh`, page scroll locked),
   and in landscape the figure and the controls sit side by side with the controls scrolling on
   their own, so the time and progress never scroll away (iPad Safari).

## Consequences

- Positive: reminders without push infrastructure; calendar alarms work even with the app closed.
- Negative: email reminders depend on the scheduler (traffic or the 5-minute cron); a
  synthesised male voice sounds less natural than a real one.
- Negative: children use the app through a DevQuake account; consent for minors is a platform
  matter (sign-up terms and privacy policy), not handled by the app.

## Alternatives considered

- **Web Push notifications.** Rejected for now: service worker, VAPID keys and push
  subscriptions per device; email plus a calendar file cover the need.
- **Cloud text-to-speech for a male voice.** Rejected (as in ADR 0015): cost and sending texts to
  a third party.

# 0014 — Apps can keep a session alive, email their users and run scheduled work

- Status: Accepted
- Date: 2026-09-25

## Context

The workout app (ADR 0015) needs three things the platform did not offer apps:

1. **A session that does not end mid-workout.** Sessions end after 2 idle hours (sliding) and
   12 hours after sign-in at the latest (`apps/host/src/lib/auth/session.ts`). A long workout
   late in that window would lose the sign-in, and with it the ability to save.
2. **Email to its users.** Apps never see email addresses (ADR 0007, by design).
3. **Background work**, such as a monthly summary email. Managed hosting has no cron: the
   platform's own clean-up already runs opportunistically from traffic (`retention.ts`).

## Decision

Additive, optional SDK fields (`packages/plugin-sdk/src/types.ts`); older apps keep working.

1. **`ctx.session`** (`PluginSession`): `expiresAt` and `extend(hours)`. `extend` moves the
   session's end to at least 1–3 hours from now, **never beyond 24 hours after sign-in**
   (`SESSION_EXTENDED_MAX_HOURS`), and renews the cookie to match (`extendSession`). It only
   works where cookies can be set (API handlers), only for a valid, unrevoked session, and
   apps must call it only while the person is actively using them. Every app request already
   keeps the 2-hour idle timer fresh.
2. **`mail.sendToUser(userId, compose)`** (`PluginMailer`, host `plugin-mail.ts`). The host
   looks up the address and the language, checks that the account is active and may use the
   app (subscriber, assigned user or admin), calls `compose(locale)` and sends the result.
   Apps supply **plain text only** (`PluginEmail`: subject, heading, paragraphs, a small table,
   one http(s) button, a footer); `pluginEmail()` escapes everything and puts it into the
   DevQuake email layout. Every send is recorded in `email_outbox` as `app:<id>`.
3. **`scheduled(ctx)`** platform hook (`PluginScheduledContext`: `db`, `baseUrl`, `now`,
   `mail`). `maybeRunScheduled()` (`plugin-scheduler.ts`) runs every app's hook **at most once
   an hour per server process**, after the response of any app page or API request (Next's
   `after()`). There is also an optional cron entry point: `GET /api/scheduled` with
   `Authorization: Bearer <CRON_SECRET>`, which is disabled (404) without `CRON_SECRET`. Hooks
   must be idempotent and handle a limited batch per run. Failures are logged to the activity
   log under the app's id and never reach the visitor.

## Consequences

- Positive: apps get these capabilities without ever handling addresses, cookies or timers,
  and the rules (24-hour cap, access check, escaping) live in one place.
- Positive: scheduled work needs no infrastructure; a cron call can be added later for
  exact timing.
- Negative: without traffic and without `CRON_SECRET`, scheduled work waits for the next
  visit to any app, so a monthly email can be hours late.
- Negative: an extended session lives up to 24 hours instead of 12. The cap, and the rule
  that apps extend only during active use (the workout app only while a workout runs), keep
  the risk small. Signing out or revoking still ends it at once.
- Negative: with several server processes, each may run the hook once an hour; apps must
  guard against double work in their own database (the workout app writes its report row
  before sending).

## Alternatives considered

- **Raise the session lifetime for everyone.** Rejected: it weakens every session to serve
  one app's case.
- **Give apps the email address.** Rejected: it breaks ADR 0007's rule that apps get the
  minimum, and every app would need its own escaping and layout.
- **An external job runner or Hostinger cron only.** Not available on the managed Node.js
  plan; the cron route stays optional.

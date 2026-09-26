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
- Update (ADR 0019): the host now runs the hooks at most every **5 minutes** (not hourly), so
  reminders arrive on time; the cron entry point should be called every 5 minutes.
- Negative: with several server processes, each may run the hook every run; apps must
  guard against double work in their own database (the workout app writes its report row
  before sending).

## Alternatives considered

- **Raise the session lifetime for everyone.** Rejected: it weakens every session to serve
  one app's case.
- **Give apps the email address.** Rejected: it breaks ADR 0007's rule that apps get the
  minimum, and every app would need its own escaping and layout.
- **An external job runner or Hostinger cron only.** Not available on the managed Node.js
  plan; the cron route stays optional.

## Follow-up: sign-in ended while filling in a form (workout 0.8.3)

- Active use of any app keeps the sign-in going, not only a running workout. The host adds
  `AppActivityKeepAlive` to every app page for signed-in visitors with access. After a tap, a key
  press or typing, it posts to the reserved `POST /api/_active` (plugin API route), at most every
  5 minutes and only while the tab is visible. Every plugin API request also counts: the lookup
  keeps the session from going idle, and a session that ends within 2 hours is extended by 3 hours.
  The cap stays 24 hours after sign-in. An app left open without use still signs out after 2 hours.
- A failed session lookup (for example a database error) is no longer reported as "sign in". `appAccess()` returns reason `unavailable`, the plugin API answers 503 and the app page shows a "try again" gate. Each case is logged as `auth.session.lookup_failed` in the activity log.
- The workout forms (plan, routine builder, own exercise) keep what was entered in `localStorage` when a save answers 401. They show a "Sign in again" link (`/?next=<this page>#account`) and fill the form back in after the sign-in. Drafts older than a day are dropped.

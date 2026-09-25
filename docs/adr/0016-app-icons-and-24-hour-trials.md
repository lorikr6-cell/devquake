# 0016 — App icons and 24-hour trials

- Status: Accepted
- Date: 2026-09-26

## Context

1. Every project has a generated logo (initials, colour, symbol; `lib/project-avatar.ts`) that
   the landing page, the account page and `/admin-cp` show. An app on `<id>.devquake.com` did
   not: its tab had the DevQuake favicon and its toolbar only the app's name.
2. Apps open only for subscribers, assigned users and admins (ADR 0006), and subscribing can
   cost NPS points (ADR 0012). People could not see an app from the inside before paying.

## Decision

1. **App icons.** `GET /api/app-icon/<plugin>` (root domain) returns the app's project logo as
   a standalone SVG (`projectAvatarSvg`, no scripts; `?v=` changes with the logo; public, since
   logos are public on the landing page). The host uses it as the favicon of every app page,
   unless the page sets its own icons. Apps get it in **`ctx.app`** (`{ name, iconUrl }`, an
   additive, optional SDK field) and show it next to their name in the toolbar. The access
   page shows the logo too. Apps without a project row (local development) get the automatic
   logo of their manifest name.
2. **24-hour trials** (`project_trials`, migration 0018). A signed-in member who is not
   subscribed or assigned (and not an admin) can try each online app **once**, free, for 24
   hours (`TRIAL_HOURS`), from the project card ("Try it free for 24 hours") or from the app's
   access page. During the trial `appAccess()` lets them in (pages and API). Afterwards the
   access page says the trial ended and offers to subscribe; the button is not offered again
   (the primary key `(user_id, project_id)` makes it once-only).
3. **Clean-up.** If they do not subscribe, what they created is deleted by the app's
   `deleteUserData` hook `TRIAL_DATA_KEEP_DAYS` (30) days after the trial ended
   (`cleanUpEndedTrials`, with the daily retention run), and `data_deleted_at` records it.
   Subscribing or being assigned in time keeps the data. This follows the platform rule that
   apps keep no data of people who left.
4. Starting a trial is logged (`project.trial.started`) and shown in the member's account
   activity; `/admin-cp/projects` shows how many members tried each project.

## Consequences

- Positive: people can judge an app before spending points; apps look like themselves.
- Positive: apps need no change for trials; their existing `deleteUserData` hook does the
  clean-up.
- Negative: a member can create an app's data during a trial that lives up to 30 days
  without a subscription. The privacy policy lists this.
- Negative: one trial per member and project; a member who wants a second look has to
  subscribe.

## Alternatives considered

- **Trials that cost nothing but reset the data at the end.** Rejected: deleting at once
  punishes people who subscribe an hour late.
- **Rendering the logo inside each app's layout from host code.** Not possible: the app owns its
  layout (plugin isolation). A URL in `ctx` keeps apps independent.

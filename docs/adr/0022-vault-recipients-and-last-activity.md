# 0022 — Routes for signed-in members, mail to non-subscribers and last activity (My vault)

- Status: Accepted
- Date: 2026-09-28

## Context

The **My vault** app (`plugins/myvault`, `myvault.devquake.com`) keeps entries encrypted in the
browser and can release an entry's vault key to people the owner chose, once the owner has been
inactive for a while (a "dead man's switch"). The platform lacked three things for that:

1. Recipients are DevQuake accounts (the owner's referral network), but they are usually **not
   subscribed** to the vault app. App pages and APIs were closed to non-subscribers, so they could
   not open what was released to them.
2. `mail.sendToUser` (ADR 0014) only writes to people **with access** to the app, so the release
   email could not reach them.
3. "Inactive" must mean **not using DevQuake at all**, not just not opening the vault. Apps cannot
   see sign-ins or sessions (ADR 0007).

## Decision

Three additive, optional SDK fields (`packages/plugin-sdk/src/types.ts`); older apps are unchanged.

1. **`manifest.signedInRoutes: { pages?: string[]; api?: string[] }`**: route patterns any
   signed-in DevQuake user may use without access to the app. The host
   (`plugin-host` page and `plugin-api` route, `isSignedInRoute` in `lib/public-pages.ts`) lets such
   requests through when the only reason for refusing was a missing subscription (`subscribe`,
   `trial-ended`); signed-out visitors are still refused. The app must check who may see what on
   these routes (the vault: only the owner, or a recipient of a released entry).
2. **`manifest.mailWithoutAccess: boolean`** and **`sendToUser(id, compose, { withoutAccess })`**
   (`PluginMailOptions`): an app that declares it may email active DevQuake users without access to
   it. The host (`pluginMailer(id, allowWithoutAccess)`) honours the option only for such apps; the
   account must still be active, and the address never reaches the app.
3. **`PluginScheduledContext.lastActiveAt(userIds)`**: when each person was last active on
   DevQuake, the later of `users.last_login_at` and the newest `sessions.last_seen_at` (refreshed by
   every page or app request with the session). Host: `lib/last-activity.ts`, passed by
   `plugin-scheduler.ts`. At most 500 ids per call; ISO times in UTC, null when never.

The vault uses all three: `/open/:id` (page and API) are signed-in routes, the release email goes
out with `withoutAccess`, and the release rule counts from `lastActiveAt` (with the vault's own
activity as a fallback on hosts without it).

## Consequences

- Positive: recipients need only a free DevQuake account; nothing about them (address, sessions)
  is exposed to the app; inactivity is measured across the whole platform.
- Positive: all three are generic (another app could share something with non-subscribers).
- Negative: signed-in routes move an access decision into the app; each such route must be
  reviewed (the vault's `entryForOpening`). `mailWithoutAccess` could be misused for unsolicited
  mail; apps are in this repository, so the manifest flag is visible in review.
- Negative: `sessions.last_seen_at` only moves while a session is used; a person who reads DevQuake
  emails but never signs in counts as inactive, which is the intended meaning.

## Alternatives considered

- **Recipients by email address**: the host would send to a typed address. Rejected by the owner:
  apps would handle addresses, and recipients still need an account to open an entry.
- **Only the vault's own visits as activity**: no platform change, but someone active elsewhere on
  DevQuake could trigger a release just by not opening the vault.
- **A per-app database-variable prefix** (`VAULT_DB_*`): not needed; the variables were renamed to
  `MYVAULT_DB_*`, which the host derives from the app id.

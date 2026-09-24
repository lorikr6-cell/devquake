# 0006 — Project subscriptions and a session shared with app subdomains

- Status: Accepted
- Date: 2026-09-24

## Context

Signed-in users should subscribe to projects and only then be able to use the project's app on
`<plugin_id>.devquake.com`, once it is online. Until now the session cookie was host-only
(`__Host-dq_session` on `devquake.com`), so an app subdomain could not tell who the visitor is,
and every online app was open to everyone.

## Decision

- **Subscriptions**: `project_subscriptions (user_id, project_id)`. A signed-in user can
  subscribe to any public, non-archived project (online or not) from the landing page or
  `/account`, and unsubscribe again. `/account` lists **Available projects** (not a member) and
  **Your projects** (subscribed, or assigned by the owner via `user_projects`); a project appears
  in exactly one of them. The owner can also add or remove a user's subscriptions in
  `/admin-cp/users/<id>`; like every change there, it is saved with "Submit changes" and emailed.
- **Access to an app** = the app is online (public project, `is_online`, deployed) **and** the
  visitor is a subscriber, an assigned user, or an admin/owner. Otherwise the app subdomain shows
  an access page (sign in / subscribe) instead of the plugin, `plugin-api` answers 401/403, and the
  plugin's page code is not executed. Implemented in `appAccess()` (`apps/host/src/lib/plugins.ts`)
  and checked in both `plugin-host/[plugin]/layout.tsx` and `page.tsx`.
- **Shared session**: the session cookie becomes `__Secure-dq_session` with
  `Domain=.devquake.com` (HttpOnly, Secure, SameSite=Lax), so app subdomains receive it. Existing
  sessions end once (users sign in again after deploying).
- **Search engines**: app subdomains are now sign-in only, so their `robots.txt` is
  `Disallow: /` and their sitemap is empty; apps are presented on the landing page.
- **Local development**: browsers refuse `Domain=localhost`, so on plain `localhost` the session
  stays host-only and the access check is skipped (as it is without a database). Use
  `ROOT_DOMAIN=lvh.me:3000` (resolves to 127.0.0.1 with all subdomains) to test signed-in access
  to apps locally.

## Consequences

- Every plugin now runs on subdomains that receive the session cookie. The cookie is HttpOnly,
  so plugin scripts cannot read it, but a plugin's server code could; plugins are first-party
  workspace packages reviewed like the host, which keeps this acceptable. Third-party plugins
  would need a different design.
- Plugins do not yet know _who_ the user is: `PluginContext` is unchanged. Passing the user to
  plugins is an SDK change and needs its own ADR.
- `/admin-cp` pages use `Referrer-Policy: same-origin` (not `no-referrer`): `no-referrer` makes
  browsers send `Origin: null` on form posts, which Next's Server Actions CSRF check rejects.

## Alternatives considered

- **Keep the host-only cookie and hand a token to the app via a redirect**: more moving parts
  (token exchange per subdomain) for no benefit while all apps are first-party.
- **Subscription only as a notification preference, apps stay open**: does not meet the
  requirement that only subscribers can use an app.

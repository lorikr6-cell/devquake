# apps/host — the DevQuake host application (Next.js 16, App Router)

Serves `devquake.com` and mounts every plugin on `<id>.devquake.com`.

## Key files

- `src/proxy.ts` — subdomain router (Next 16 `proxy`, formerly `middleware`). Rewrites plugin
  subdomains to `/plugin-host/<id>/...` and `/plugin-api/<id>/...`. Keep it thin: no DB calls.
- `src/lib/domain.ts` — the ONLY place that knows about domains/subdomains. Reuse, don't duplicate.
- `src/lib/plugins.ts` — loads plugins from the generated registry, builds `PluginContext`
  (`user`, `db`, `people`, `changelog`; ADR 0007/0008).
- `src/lib/plugin-db.ts` — each app's own MySQL database from `<ID>_DB_*` (ADR 0007).
- `src/lib/plugin-platform.ts` — the apps' platform hooks: `collectPluginStats()` (admin
  dashboard), `deleteUserDataInPlugins()` (account deletion) and `deleteUserDataInPlugin()`
  (unsubscribing from one app).
- `src/lib/plugin-changelog.ts` — an app's release notes from its `CHANGELOG.md`, embedded at
  build time in `src/plugins/registry.changelog.generated.ts` (ADR 0008).
- `src/app/plugin-host/**`, `src/app/plugin-api/**` — generic plugin mount points. They must stay
  plugin-agnostic: never import a specific plugin here.
- `src/plugins/*.generated.ts` — produced by `pnpm registry`. NEVER edit by hand.
- `src/lib/db.ts` — MySQL pool (`MAIN_DB_*` env vars). Server-only; always use `?` placeholders.
- `src/lib/auth/` — scrypt passwords, DB sessions (roles: owner / admin / user), the two-step
  sign-in with emailed codes and 3-strike lockout (`flow.ts`), sign-in snapshots (`snapshot.ts`,
  `ip-intel.ts`, `user-agent.ts`), server actions (`actions.ts`), guards `requireOwner()` /
  `requireAdmin()` / `requireUser()`. Policy and rationale: ADR 0005.
- `src/lib/auth/activation.ts`, `src/app/activate/route.ts` — sign-up activation links (welcome
  email); pending accounts cannot sign in.
- `src/lib/mail/` — SMTP sender with `email_outbox` log and branded templates (logo/banner PNGs in
  `public/brand/email-*.png`, rendered by `scripts/render-email-images.mjs`). Every dynamic
  value in a template goes through `esc()`; the only contact address is contact@devquake.com.
- `src/components/auth/` — landing-page sign-in/sign-up card and the code form.
- `src/components/analytics.tsx` — Google Analytics (G-44LNW6JYBF), loaded ONLY after consent
  (cookie `dq_consent` on the parent domain, so one answer covers all subdomains); never in
  `/admin-cp`. Do not add other trackers or load gtag anywhere else.
- `src/lib/contact.ts`, `src/components/contact-form.tsx` — landing-page contact form.
- `src/lib/public-projects.ts`, `src/components/landing/` — landing-page projects (expandable
  cards; idea summaries are internal and never shown) and public statistics.
- Visibility: anything shown outside `/admin-cp` (landing page, public stats, sitemap, plugin
  availability) must filter on `projects.is_public = 1` and, for ideas, `ideas.is_public = 1`
  of a public project. New projects/ideas default to private.
- `src/lib/visits.ts`, `src/app/api/visit/route.ts`, `src/components/visit-beacon.tsx` —
  cookie-free visitor counting (daily salt, only totals kept).
- `isPluginOnline()` / `appAccess()` in `src/lib/plugins.ts` — a plugin is served only when its
  project is online, and only to subscribers, assigned users and admins (ADR 0006). The session
  cookie is shared with subdomains; never read it in plugin code.
- Theme: `src/components/theme-picker.tsx`, `src/lib/theme.ts`, `src/lib/theme-server.ts`; the
  `dark:` variant in `src/app/globals.css` honours `data-theme`. Use `dark:` classes, never
  `prefers-color-scheme` directly (docs/brand.md).
- Referrals: `src/lib/referrals.ts` (codes, invites, attribution at sign-up, +1 NPS at
  activation), `src/app/r/[code]/` (invite link + QR PNG), `src/components/account/`.
- Account deletion: `src/lib/account-deletion.ts` — `deleteUserAccount()` serves both the
  user's own deletion and the owner removing accounts (`removeUsersAsOwner()`, from
  `/admin-cp/users`: "Delete selected" with the inactivity filter, or "Delete this account" on a
  user page; never the owner account or yourself). An owner may delete their own account only
  when `ownerSuccession()` finds another active owner or an admin (the longest-standing admin is
  then promoted to owner, told in their account activity and by email). Deletion also removes
  the avatar and all sessions, and the action clears the session cookie. **Any new table with
  personal data must be cleaned there too** (and listed in the privacy policy).
- Forms whose server action can reject input and must keep what was typed or ticked submit via
  `onSubmit` + `startTransition` (see `_components/remove-users.tsx`): React 19 otherwise resets
  the form after every action.
- Avatars: `src/lib/avatars.ts`, `src/app/avatar/[userId]/route.ts` (self and admins only).
- `src/lib/auth/signup-rules.ts` — sign-up validation shared by the browser (live checks in
  `components/auth/signup-form.tsx`) and the server. Change the rules only there.
- `listAccountEvents()` in `src/lib/admin/users.ts` — the "Recent account activity" on
  `/account`: a whitelist of user-facing actions. `user.updated` messages are shown to the user,
  so never put internal data (e.g. the rating) in them; use `metadata`.
- `src/lib/subscriptions.ts`, `src/lib/subscription-actions.ts`,
  `src/components/landing/project-actions.tsx` — subscribe / unsubscribe / open. Unsubscribing
  (`UnsubscribeButton`, a confirmation dialog warning about the data loss) first deletes the
  user's data in that app via its `deleteUserData` hook; if that fails the subscription stays.
  An owner removing a subscription in `/admin-cp` only removes access and keeps the data.
- Community ideas (members' proposals; migration 0013): `src/lib/community-ideas.ts` (queries;
  every function re-checks access), pure rules in `community-idea-rules.ts` (who may see, vote,
  comment; validation), actions in `community-actions.ts`, pages under `src/app/ideas/`, staff
  list in `/admin-cp/community`. Private ideas: author only (not even staff). Pictures are shrunk
  in the browser (`shrinkPhoto` from `@devquake/ui`) and served by `/ideas/<id>/image` after the
  same access check. Separate from the roadmap `ideas` table; "Add to roadmap" copies into it.
- Project likes and ratings: `src/lib/project-feedback.ts` (+ pure rules in
  `project-feedback-rules.ts`), `src/lib/feedback-actions.ts`,
  `src/components/landing/project-feedback.tsx` and `rating-form.tsx`. Anyone signed in can like
  a public project; only live projects can be rated (quality and usefulness, 1–5, averaged over
  all raters). The landing page lists live projects first, then the most liked.
- Dates (ADR 0010): show timestamps with `<DateTime value={...} />` (`src/components/date-time.tsx`)
  or `formatDateTime(value, await getTimeZone())` (`src/lib/timezone-server.ts`); the zone comes
  from the `dq_tz` cookie kept by `TimeZoneSync` (root layout). `formatDate` in the admin UI kit
  is only for `DATE` columns. Store UTC; convert typed date-times with `localDateTimeToUtc`.
- Server actions that change what the current page shows call `refresh()` from `next/cache`
  (Next 16). Never `redirect()` to the same page with only a `#hash`: it does not re-render.
- QR codes: always the branded generator — `brandedQrSvg` from `@devquake/ui/qr` (inline SVG)
  or `brandedQrPng` in `src/lib/qr-png.ts` (PNG for emails and downloads). `qr-png.test.ts`
  decodes them with a real reader; keep the logo within its limits (docs/brand.md).
- `src/lib/return-url.ts` — the `?next=` address after signing in (e.g. back to an app
  subdomain). Only DevQuake's own root and app subdomains are accepted (no open redirects).
- `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/seo.ts` — per-hostname sitemap and
  robots. Root: public pages, plus the sitemaps of online apps with public pages. Subdomain: the
  app's `publicPages` only (ADR 0009); everything else disallowed. Add new public root pages to
  `sitemapEntries()`; never list `/admin-cp`.
- Public app pages: `isPublicPage()` (`src/lib/public-pages.ts`). For visitors without access
  the plugin layout adds nothing and the page (`plugin-host/[plugin]/[[...path]]/page.tsx`)
  shows either the access gate or the public page inside the app's layout. Never decide by path
  in a layout: layouts are not re-rendered on client navigation.
- Analytics tags every page with `content_group` (`src/lib/content-group.ts`: the app's
  subdomain or `site`); apps send events with `trackEvent()` from `@devquake/ui`.
- `src/app/privacy/page.tsx` — privacy policy. It must describe what the code really does:
  when you add data collection, a cookie, a third-party service or change retention
  (`src/lib/retention.ts`), update the policy and `PRIVACY_POLICY_UPDATED` in `src/lib/legal.ts`
  in the same change. `OPERATOR` in `legal.ts` holds the controller's legal name/address.
- `src/components/site-footer.tsx` — footer incl. the Hostinger referral link
  (`rel="sponsored"`, always labelled as a referral).
- `src/lib/activity.ts` — `logActivity()` for the site-wide `activity_log` (never throws).
- `src/app/admin-cp/` — control panel (sign-in, dashboard, ideas, projects; owner only: users,
  messages, statistics, activity log). Unlinked and root-domain only. Every page AND server
  action must call `requireAdmin()` or, for anything showing other users' data, `requireOwner()`.
  Navigation is a sidebar (`_components/admin-nav.tsx`: `AdminSidebar`, `AdminNavStrip` on
  phones); add new sections to the groups in `(panel)/layout.tsx`.
- Retention (`src/lib/retention.ts`): users' sign-in activity (`auth_snapshots`) and account
  activity (the actions in `src/lib/account-events.ts` plus `user.updated`) are deleted after
  90 days; screens that show them filter the same period and show a `RetentionNote`.
- `src/app/verify`, `src/app/account` — public code entry and the user's account page.
  Schema changes go in a new `db/migrations/NNNN_*.sql` (see `db/README.md`).

## Rules

- Next.js 16: `params` and `searchParams` are Promises — always `await` them.
- Server Components by default; add `'use client'` only on leaf components that need it.
- Host-only pages (landing, auth, admin) go under `src/app/` like a normal Next app.
  Do not use a top-level path that a plugin might expect to own on its subdomain; the proxy
  only rewrites on subdomains, so host paths on the root domain are safe.
- Reserved subdomains are defined in `scripts/generate-registry.mjs` (`RESERVED`).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

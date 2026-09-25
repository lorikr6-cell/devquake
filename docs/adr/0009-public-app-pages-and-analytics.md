# ADR 0009: Public app pages, app sitemaps and analytics per app

Status: accepted · 2026-09-24

## Context

Apps are members-only (ADR 0006), so their subdomains were closed to everyone and to search
engines. Some app pages, like a user manual, are useful to anyone deciding whether to try the
app, and should be findable. Google Analytics ran on every subdomain but could not tell the
apps apart, and apps had no way to report what people do in them.

## Decision

- Additive manifest field `publicPages?: Array<{ path; title }>`: exact static paths that
  anyone may open without signing in or subscribing. For a visitor without access, the host's
  plugin page (not the layout, which is not re-rendered on client navigation) matches the
  path from the route params and shows the public page in the app's layout, or the access
  gate for any other path. API routes stay members-only.
- Public pages of **online** apps are listed in the app's own `sitemap.xml`, allowed in its
  `robots.txt` (everything else stays disallowed), linked from the project card, and the root
  `robots.txt` references every app sitemap.
- Google Analytics (still consent first) tags every page view and event with
  `content_group` = the app's subdomain, or `site` for devquake.com.
- `@devquake/ui` exports `trackEvent(name, params)`: sends a GA event only when gtag is loaded
  (after consent). Parameters are counts, categories and flags; never personal data or content.

## Consequences

- A public page must not show members' data; it receives `ctx.user` (possibly a
  non-subscriber) but must not call the app's API. Keep them informational.
- In GA, apps can be compared through the content group; the events apps send appear as GA
  events and can be marked as key events in the GA admin.

# Roadmap

Status of this document: **planning**. Plugin ids, priorities and limits are proposals until an
ADR or a plugin scaffold makes them final.

## Phase 1 — Five plugins

| Proposed id | Plugin                | Idea doc                                         | Key platform needs             |
| ----------- | --------------------- | ------------------------------------------------ | ------------------------------ |
| `utilities` | Utility bill manager  | [ideas/utilities.md](plugins/ideas/utilities.md) | **Built (v0.1.0)**             |
| `darts`     | Dart game manager     | [ideas/darts.md](plugins/ideas/darts.md)         | Auth, database, QR, realtime   |
| `pulse`     | Realtime events API   | [ideas/pulse.md](plugins/ideas/pulse.md)         | WebSockets, JWT, billing       |
| `workout`   | Workout tracker       | [ideas/workout.md](plugins/ideas/workout.md)     | Auth, database                 |
| `shopping`  | Shared shopping lists | [ideas/shopping.md](plugins/ideas/shopping.md)   | **Built (v0.4.0)**; push later |

## Phase 0 — Platform capabilities (before or alongside the first plugin)

All five plugins share needs that belong in the host and the SDK, not in each plugin. Each item
below needs an ADR and is exposed to plugins through `PluginContext` (see
[architecture/plugin-system.md](architecture/plugin-system.md)), never by importing host code.

| Capability          | Needed by                      | Notes                                                                                  |
| ------------------- | ------------------------------ | -------------------------------------------------------------------------------------- |
| Accounts and login  | all                            | One account across all subdomains: session cookie on `.devquake.com`                   |
| Roles               | utilities, darts, workout      | Platform roles (platform admin) plus per-plugin roles (for example utilities admin)    |
| Database            | all                            | Hostinger includes MySQL; a managed Postgres (for example Supabase) is the alternative |
| Realtime updates    | shopping, darts, pulse         | WebSockets or Server-Sent Events; see the hosting risk below                           |
| Push notifications  | shopping, pulse                | Web Push (VAPID) for browsers and installed PWAs                                       |
| Email               | utilities, shopping (invites)  | Invitations, password reset, payment reminders                                         |
| QR codes            | darts, shopping (share a list) | Generated server-side, printable                                                       |
| Payments            | pulse (subscriptions)          | Provider to be decided (for example Stripe or Paddle)                                  |
| Consent and privacy | all (analytics, ads)           | GDPR: cookie consent, privacy policy, data export and deletion per user                |

### Hosting risk: realtime on managed hosting

Realtime features (WebSockets, long-lived connections) have not been verified on Hostinger's
managed Node.js hosting. Before building `pulse`, `shopping` live updates or live dart scoreboards,
run a spike: deploy a minimal WebSocket and a minimal Server-Sent Events endpoint and test them on
production. If neither works reliably, options are a Hostinger VPS, or a separate realtime service
(which `pulse` itself could become). Record the outcome in an ADR.

## Suggested build order

1. **Platform foundation**: accounts, roles, database, email (ADR each).
2. **`utilities`** (built): exercises auth, roles and the database with no realtime needs.
3. **`workout`**: CRUD plus leaderboards; public-facing and good for traffic.
4. **Realtime spike** (see above), then **`pulse`** as the shared realtime and push backbone.
5. **`shopping`**: built first as the pilot of ADR 0007 (own database), without `pulse`: live
   updates by polling and in-app notifications; Web Push for closed apps can follow.
6. **`darts`**: uses QR codes and, optionally, `pulse` for live scoreboards.

This order is a suggestion; revisit it when the platform foundation is done.

## Phase 2 — Analytics and self-sustaining revenue

Starts once at least the five plugins above are live. The goal is that the site covers its own
hosting and service costs.

### Analytics and tooling

- **Google Analytics 4** across all subdomains (one property, cross-subdomain measurement), loaded
  only after consent (Google Consent Mode v2). **Done**: `G-44LNW6JYBF`, consent banner and
  "Cookie settings" in the footer (`apps/host/src/components/analytics.tsx`). Visitors are largely in the EU, so a consent banner
  is required before any analytics or ad cookies.
- **Google Search Console** for the root domain and each plugin subdomain.
- **Error monitoring** (for example Sentry) and **uptime monitoring** on the root domain and each
  plugin's health endpoint.

### Revenue options (to evaluate, not decided)

| Option                   | Fits                     | Notes                                                                  |
| ------------------------ | ------------------------ | ---------------------------------------------------------------------- |
| Subscriptions            | pulse, premium features  | `pulse` free tier with limits; paid tier unlimited (see idea doc)      |
| Premium plans per plugin | utilities, darts (clubs) | For example: more addresses, more boards, exports, branding            |
| Display ads (AdSense)    | workout, public pages    | Needs consent; keep ads out of paid tiers                              |
| Affiliate links          | workout, darts, host     | Equipment recommendations; Hostinger referral live on the landing page |
| Donations                | all                      | For example Buy Me a Coffee or GitHub Sponsors                         |

### Cost tracking

Keep a simple monthly table of costs (hosting, domain, email, database, payment fees) and
revenue per source, and review it before choosing which revenue options to build first.

## How to use this roadmap

- To start a plugin: `/new-plugin <id> "Name"` with the idea doc as the description, then ask the
  `architect` agent to turn the idea doc into an implementation plan.
- When an idea changes, update its doc in `docs/plugins/ideas/`. When a plugin is scaffolded, its
  idea doc stays as the product spec and `plugins/<id>/README.md` documents the implementation.

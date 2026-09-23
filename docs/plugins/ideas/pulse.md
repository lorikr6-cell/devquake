# Idea: Realtime events API (`pulse`)

Status: **idea** · Proposed subdomain: `pulse.devquake.com` (the name is a placeholder)

## Summary

A realtime event service. Apps (DevQuake plugins or external customers) send actions to the API;
`pulse` tracks them and emits events to connected clients over WebSockets, and as push
notifications, to a specific app or to several apps. A free tier is limited; a paid subscription
removes the limits. Security relies on strong JWTs and a separate database of tokens and access
keys, with keys pre-generated for upcoming transactions.

Inside DevQuake, `pulse` is also the proposed realtime backbone for `shopping` (live list
updates) and `darts` (live scoreboards).

## Concepts

| Term    | Meaning                                                                         |
| ------- | ------------------------------------------------------------------------------- |
| Account | A customer (developer or company) with a plan                                   |
| App     | A registered application under an account; has credentials and channels         |
| Channel | A named stream inside an app (for example `list:123`) that clients subscribe to |
| Action  | Something an app reports (HTTP or WebSocket message)                            |
| Event   | What `pulse` emits to subscribers or as a push notification                     |

## Core features (MVP)

1. **App registration**: create apps, get credentials, rotate them.
2. **Publish API**: server-side HTTP endpoint to publish an event to a channel of an app.
3. **WebSocket gateway**: clients connect, authenticate with a short-lived JWT, subscribe to
   channels they are allowed to see, receive events.
4. **Push notifications**: Web Push (VAPID) to subscribed browsers when a client is offline.
5. **Action log**: store actions and events per app for a retention window (plan-dependent).
6. **Usage metering**: count connections, events and push messages per app and account.
7. **Plans and limits**: enforce free-tier limits, unlock unlimited use for paid plans.
8. **Dashboard**: apps, keys, usage graphs, plan, billing.

## Security design

- **Separate database** for credentials, tokens and usage, isolated from product data.
- **Credentials**: an app has a key id and a secret; only a hash of the secret is stored.
- **JWT**: short-lived access tokens (minutes), signed with asymmetric keys (for example ES256 or
  EdDSA) with key ids (`kid`) for rotation; claims include app, channels and expiry.
- **Pre-generated keys for next transactions** (interpretation, to confirm): every successful
  authenticated call returns the next single-use access key; the server stores the expected next
  key (hashed) so each key works exactly once, which stops replayed requests. Alternative:
  standard short-lived JWT plus refresh-token rotation with reuse detection.
- **Channel authorisation**: a client token lists the channels it may subscribe to; the app's
  backend signs it.
- **Rate limiting** per key and per IP; audit log of credential changes.

## Plans (draft, numbers are placeholders)

| Plan | Apps      | Concurrent connections | Events per month | Push messages | Log retention |
| ---- | --------- | ---------------------- | ---------------- | ------------- | ------------- |
| Free | 1         | 20                     | 10,000           | 1,000         | 24 hours      |
| Pro  | Unlimited | Unlimited (fair use)   | Unlimited        | Unlimited     | 30 days       |

Pricing, fair-use terms and the payment provider are open questions.

## Data model (sketch, separate database)

- `Account` (id, plan, billingCustomerId) · `App` (id, accountId, name)
- `Credential` (id, appId, keyId, secretHash, createdAt, revokedAt)
- `IssuedKey` (id, appId, keyHash, usedAt, expiresAt) for the next-transaction keys
- `SigningKey` (kid, publicKey, createdAt, retiredAt)
- `UsageCounter` (appId, period, connections, events, pushes)
- `EventLog` (id, appId, channel, type, payload, at) · `PushSubscription` (id, appId, endpoint, keys)

## Routes (sketch)

| Pattern                  | Page or API                                     |
| ------------------------ | ----------------------------------------------- |
| `/`                      | Product page and documentation                  |
| `/dashboard`             | Apps, keys, usage, plan                         |
| `/api/v1/events`         | Publish an event (server-to-server)             |
| `/api/v1/tokens`         | Issue client tokens                             |
| `/api/v1/push/subscribe` | Register a push subscription                    |
| WebSocket endpoint       | To be decided by the realtime spike (see below) |

## Platform capabilities needed

Accounts, a second database, WebSockets, Web Push, payments and subscriptions, rate limiting.

## Risks and open questions

- **Hosting**: long-lived WebSocket connections are not verified on the current managed hosting.
  See "Hosting risk" in [the roadmap](../../roadmap.md). `pulse` may need a VPS or its own service.
- Is `pulse` a public product for external developers, or internal infrastructure first?
- Confirm the intended meaning of "access key pre-generated for the next transactions".
- Payment provider, pricing, VAT handling (EU), and terms of service.

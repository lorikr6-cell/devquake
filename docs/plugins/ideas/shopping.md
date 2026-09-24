# Idea: Shared shopping lists (`shopping`)

Status: **built** (v0.4.0, see `plugins/shopping/README.md` and `CHANGELOG.md`) · Subdomain:
`shopping.devquake.com`

Built: lists planned by date (Today tab, week/month/year calendar), stores with
type/location/description, products with photos, prices and totals, shopping mode, "not
needed" strike-out, suggestions and usual products from the user's history, statistics
(including how often friends joined), invite link/code/QR and adding referrals, a user manual.

Live collaboration works by polling (changes show within about 5 seconds while the app is
open) and in-app notifications (bell, pop-ups, optional system notifications while a tab is
open). Still open: notifications when the app is **closed**. Web Push (free browser push
services, works on the current hosting) needs a service worker and an SDK addition; it does not
wait for `pulse`.

## Summary

Shopping lists shared live with family and friends. A user creates a list or joins an existing
one; everyone sees changes instantly and gets push notifications. The person at the shop ticks
items off and can enter prices, so everyone sees price × quantity and the list total.

## Users and access

| Role   | Can                                                                |
| ------ | ------------------------------------------------------------------ |
| Owner  | Everything on the list; invite and remove members; delete the list |
| Member | Add, edit and tick items; enter prices                             |

## Core features (MVP)

1. **Start screen**: create a new list, or join a shared list (invite link, short code or QR).
2. **Items**: each item has **store**, **item name** and **quantity** (with an optional unit),
   plus an optional **price**, a note, who added it, and a done state.
3. **Totals**: per item `price × quantity = total`; list total and total per store; items
   without a price are shown as not priced.
4. **Live collaboration**: changes appear for all members without refreshing.
5. **Push notifications**: for example "Ana added milk" or "Mihai started shopping"; each member
   controls which notifications they receive.
6. **Shopping mode**: large tick targets, grouped by store, done items move to the bottom.
7. **Sharing**: invite link or code, revocable by the owner.

## Later

- ~~Suggestions from previous lists and frequently bought items.~~ Built in 0.3.0.
- ~~Price history per item and store.~~ Built in 0.2.0 (Statistics).
- Web Push notifications when the app is closed (service worker, VAPID keys).
- Offline mode with sync (installable PWA).
- Recurring lists (for example weekly groceries).

## Data model (sketch)

- `List` (id, name, ownerId, createdAt) · `ListMember` (listId, userId, role, joinedAt)
- `Invite` (id, listId, code, expiresAt, revokedAt)
- `Item` (id, listId, store, name, quantity, unit, price, note, addedBy, doneBy, doneAt, order)
- `NotificationPreference` (userId, listId, events)

## Routes (sketch)

| Pattern                | Page or API                           |
| ---------------------- | ------------------------------------- |
| `/`                    | My lists; create or join a list       |
| `/join/:code`          | Join via invite                       |
| `/lists/:id`           | The list (edit and shopping mode)     |
| `/lists/:id/share`     | Invite link, code and QR              |
| `/api/lists/:id/items` | Create, update, tick and delete items |

## Platform capabilities needed

Accounts, database, realtime (proposed via `pulse`), Web Push, QR codes, email (invites).

## Open questions

- Can someone join and edit without an account (guest via invite code)?
- Should prices be per unit or per line? (Proposal: per unit, total = price × quantity.)
- Currency per list, or one default (RON)?

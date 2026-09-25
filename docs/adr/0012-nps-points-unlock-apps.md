# 0012 — NPS points unlock apps

- Status: Accepted
- Date: 2026-09-25

## Context

Members earn NPS (Net Promoter Score) points by inviting people: +1 for every invited account
that is activated (migration 0011). Until now the points were only a score. The owner wants the
points to pay for access to apps, with more complex apps costing more, and some apps free.

## Decision

- `users.nps` is the member's **available** balance. Every new account starts with **3 points**
  (`NPS_START` in `apps/host/src/lib/nps-rules.ts`, also the column default). Migration 0017
  gives every existing account +3 once. The migration is guarded, so running it again does not
  give the points a second time.
- `projects.nps_cost` is the price of subscribing to the project's app. **0 means FREE**; new and
  existing projects start at 0. Only the **owner** sets it (`/admin-cp/projects/<id>`,
  `setProjectNpsCostAction`, `requireOwner`), by how complex the app is.
- Subscribing **spends** the cost: `subscribe()` locks the user's row, checks the balance,
  deducts the points and inserts the subscription in one transaction. The amount paid is kept in
  `project_subscriptions.nps_spent`. Without enough points the button is disabled and says how
  many points are missing.
- **No refund**: unsubscribing does not give points back; subscribing again costs again.
- Subscriptions made before this change stay free and active (`nps_spent = 0`).
- **Admins and users assigned to the project** (`user_projects`) pay nothing (`subscriptionCost`).
- Cards show **FREE** or **N NPS points**. The account page explains the points in a "What are
  NPS points?" box (`#nps`) and shows the available balance next to the number of people who
  joined through the member's invitations (counted from `referral_invites`, no longer from
  `users.nps`).
- Every text is in English, German, Romanian and Hungarian (ADR 0011).

## Consequences

- `users.nps` no longer equals the number of successful referrals; use `countJoinedReferrals()`
  for that.
- A cost change affects only new subscriptions.
- The owner has no screen yet to grant or remove points by hand; that can be added to
  `/admin-cp/users` if needed.

## Alternatives considered

- **Threshold only** (points are never spent; a balance of N opens every app costing ≤ N):
  rejected, because the owner wants points to be used for subscribing.
- **Refunding on unsubscribe**: rejected by the owner; the points stay spent.

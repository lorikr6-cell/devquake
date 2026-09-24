# 0005 — Public user accounts, emailed sign-in codes and sign-in snapshots

- Status: Accepted
- Date: 2026-09-24

## Context

Visitors need to sign up and sign in on the landing page. The owner wants to manage those users
in `/admin-cp` (roles, project/plugin assignments, rating, an "Admin" flag), be notified of
nothing silently (users get an email for every change), see statistics on users, locations and
attempts, and harden sign-in: a code by email on every sign-in and a 3-hour lock after 3
consecutive failures. Every sign-up/sign-in must record time, IP, location, browser, and VPN use.

## Decision

- **One account system, one session cookie** (`__Host-dq_session`, host-only, `SameSite=Lax`)
  for site users and admins. What a user may do comes from roles:
  `platform.owner` (everything), `platform.admin` (control panel without users, statistics and
  the activity log), `platform.user` (every sign-up). Migration 0005 makes existing admins owners.
- **Two-step sign-in everywhere**: password, then a 6-digit code (crypto `randomInt`) sent by
  email. Stored as `SHA-256(token + ":" + code)` where `token` exists only in an HttpOnly cookie,
  so codes are bound to the browser and the database alone cannot be used to recover them.
  10-minute expiry, 5 tries, 3 re-sends 60 s apart, single use. Sign-up uses the same step to
  confirm the email address (`users.email_verified_at`).
- **Lockout**: 3 consecutive wrong passwords lock the account for 3 hours (and email the user);
  3 attempts on an unknown email "lock" that email the same way, so responses do not reveal
  which emails exist. 20 failures per IP in 15 minutes are throttled. Control panel sign-in by a
  non-admin fails with the generic message.
- **Snapshots** (`auth_snapshots`) on every step: IP; location, ISP and VPN/proxy detection from
  proxycheck.io (fails open after 1.5 s); browser/OS/device parsed from the user agent and
  client hints; browser time zone, language and screen from hidden form fields, with a
  time-zone-mismatch flag as an extra VPN hint.
- **Email** via SMTP (nodemailer, Hostinger mailbox), branded HTML + text templates with
  `contact@devquake.com` as the only contact. Every send is recorded in `email_outbox` (no bodies).
- **User administration**: the owner edits a user and presses "Submit changes"; all changes
  apply in one transaction, are logged, and one email summarises them with instructions (how to
  sign in, where to see projects, and — for new admins — the control panel address).
  The rating is internal and never emailed.

## Consequences

- Sign-in depends on email delivery. Without SMTP in production nobody can sign in, including
  the owner; development prints codes to the console instead.
- Anyone who knows an email can lock that account for 3 hours (the price of a strict per-account
  lock). The owner can unlock in `/admin-cp/users/<id>` or with `pnpm admin:create`.
- Visitor IPs are sent to proxycheck.io (a GDPR processor) and sign-in metadata is personal
  data: needs a privacy policy entry and a retention job (see db/README.md). Free tier: ~100
  lookups/day without a key, 1,000 with a free key.
- **Not possible**: MAC addresses (never leave the visitor's LAN) and the real location of a VPN
  user (only the VPN exit is visible).
- The session cookie stays host-only; signing in on plugin subdomains needs a separate decision.

## Alternatives considered

- **TOTP authenticator apps** instead of email codes: stronger, but the requirement is an
  emailed code per sign-in. The `users.totp_secret` column remains available.
- **Storing the plain code** until it is entered: simpler to debug, but a database leak would
  expose live codes.
- **Magic links**: one click, but links in email are easier to phish and open in other browsers.
- **Paid IP intelligence** (MaxMind, ipinfo privacy): more accurate VPN data; revisit with volume.

## Amendment (2026-09-24): sign-up activation link

Sign-up no longer uses a code. It sends a branded welcome email with an **activation link**
(`/activate?token=…`, stored as SHA-256, single use, 48 hours). The account stays `pending` and
cannot sign in until the link is opened; the link then forwards to the sign-in card with a
confirmation. Signing in to a pending account sends a fresh link (at most one per minute).
Sign-in itself is unchanged: password, then an emailed code. Mail scanners that open the link
first can only activate the account — signing in still requires the password and a code sent to
that mailbox.

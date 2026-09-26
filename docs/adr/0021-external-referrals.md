# 0021 — External referrals

- Status: Accepted
- Date: 2026-09-27

## Context

The landing page has one hard-coded partner box: the Hostinger referral. The owner wants more
partner referrals (the first one: Bitget), each with a QR code, managed from the control panel
instead of code.

## Decision

1. **Data** (`external_referrals`, migration 0020): a short link (`slug`), the partner's name,
   its https referral link, the texts in every language as JSON (caption, title, text, button;
   all four required, ADR 0011), an optional referral code (shown with a copy button, for apps
   that ask for one; migration 0021), shown or hidden, an order, and a click count. The
   migrations seed Bitget and Crypto.com.
2. **Landing page** (`components/landing/external-referrals.tsx`): each shown referral is a box
   in the Hostinger style (caption, title, text, button, partner domain and the "referral link"
   disclosure) with a QR code beside it (a PNG download too). The Hostinger box itself stays in
   code.
3. **Short link** `/go/<slug>`: the button and the QR code point here. It counts the click (a
   number only: no cookies, no IP, no user) and redirects (302, `no-referrer`) to the stored
   link, which must be https. Printed QR codes keep working when the partner link changes.
   `/go/<slug>/qr` is the PNG. `/go` has no language prefix (like `/api`).
4. **Control panel** (`/admin-cp/referrals`, admins): list with clicks, create, edit (with the
   QR code), hide or delete.

## Consequences

- Positive: new partners without a deploy; clicks visible per partner; stable QR codes.
- Negative: the texts are the owner's to translate (the form requires all four languages).
- Negative: promotions of financial products (like a crypto exchange) carry their own rules and
  risk warnings; the seeded Bitget text includes a short risk note, and the owner is
  responsible for the wording.

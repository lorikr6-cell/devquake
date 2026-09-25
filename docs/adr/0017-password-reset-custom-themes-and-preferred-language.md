# 0017 — Password reset, custom themes and a preferred language

- Status: Accepted
- Date: 2026-09-26

## Context

Members asked for three account features: resetting a forgotten password, colour themes of
their own (shareable with friends and family), and choosing the language of the whole site
instead of it following the language they last browsed in.

## Decision

1. **Password reset** (`lib/auth/password-reset.ts`, `password_resets`, migration 0018).
   "Forgot your password?" on the sign-in card opens `/forgot-password`. The answer is always
   "if this address has an account, a link is on its way", so the form cannot be used to find
   out who has an account. Active accounts get a link valid for 60 minutes; only SHA-256 of its
   token is stored, a new link cancels older ones, at most 3 emails per account and 10 requests
   per IP per hour. Accounts that are not activated get a new activation link instead. The
   link (`/password-reset?token=`) moves the token into an HttpOnly cookie and redirects to
   `/reset-password`, so the token never stays in the address bar, analytics or a Referer.
   Setting the password is single-use; it ends every session, clears a sign-in lock, cancels
   open codes and links, and emails a confirmation. Signing in still needs the emailed code.
2. **Custom themes** (`lib/custom-theme.ts`, `user_themes`, `user_theme_shares`). The theme
   picker shows its built-in themes as icons with the name as tooltip, plus (signed in) a menu
   of the member's themes and the ones shared with them. A theme has a background, text and
   accent colour and optionally a font per element (body, h1–h6, p, a, li, label, button,
   form fields) from a fixed list (system fonts and self-hosted web fonts loaded only when
   used). The editor previews every change on the page at once; its colour picker has a
   saturation/brightness square, a hue bar, a hex field and suggested colours, works with
   keyboard and touch, and shows the WCAG contrast of text on background. A theme builds on the
   light or dark mode (by background brightness) and sets the Paper/Ink/Quake tokens, so every
   page and app follows. Only `#rrggbb` colours and known font ids ever reach the CSS. The
   choice is the existing `dq_theme` cookie (`custom-<id>`); the server renders the theme only
   for its owner and the people it is shared with, else Adaptive. Sharing is by email address
   of an existing active account (as asked; unknown addresses are limited to 10 per hour);
   the owner can stop sharing, recipients can remove it from their list, deleting a theme
   removes it for everyone. Up to 20 themes per member, 25 shares per theme. A signed-in
   member's choice is also saved on their account (`users.theme`, migration 0019) and set
   again at every sign-in, on any device; a theme that was deleted or is no longer shared
   falls back to Adaptive.
3. **Preferred language** (`users.preferred_locale`). Chosen on the profile next to the
   picture ("Automatic" keeps following the browsed language). It is applied at once, at every
   sign-in (language cookie and redirect), and for emails, which prefer it over the last used
   language. The language picker can still switch any page.

All new tables reference `users` with `ON DELETE CASCADE`, so account deletion removes them;
the privacy policy lists them.

## Consequences

- Positive: members can recover access themselves; the owner no longer needs to.
- Positive: themes change every page and app without touching their code.
- Negative: sharing a theme reveals whether an address has an account, to signed-in members,
  within the hourly limit. Accepted because sharing with existing members was the requirement.
- Negative: the web fonts' `@font-face` rules are on every page (small); files download only
  when a theme uses them.

## Alternatives considered

- **Reset codes instead of links.** Rejected: sign-in already uses codes; a link is simpler for
  a rare action and still needs the inbox.
- **Free-form CSS or any Google font in themes.** Rejected: shared themes would become a way to
  inject styles or load third-party resources for other members.

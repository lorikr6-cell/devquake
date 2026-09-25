# 0020 — Platform menu, trials before subscribing, finished projects, idea to project

- Status: Accepted
- Date: 2026-09-26

## Context

Feedback on the member pages: the account menu should be on every main page, at the left edge
like the control panel; its tooltips were hidden behind the content. Apps should open only for
subscribers (the 24-hour trial, ADR 0016, is the way to look inside first). Finished projects
should stand out. Staff want to turn a popular community idea into a project. People asked for
a full screen button.

## Decision

1. **Platform menu.** `PlatformShell` (components/account/account-shell.tsx) frames the main
   pages (landing, ideas, privacy, account, messages). Signed-in members get the menu as a slim
   icon column at the left edge of the window, always collapsed, labels as tooltips; phones and
   tablets get it as a drawer (as in /admin-cp). Signed-out visitors get no menu. The sticky
   column has `z-30`: sticky elements are their own stacking layer, so without it later page
   content painted over the tooltips.
2. **Opening apps.** A project card offers "Open" only to members (subscribed or assigned).
   Others see "Try it free for 24 hours" (and "Continue your trial" while it runs) next to
   Subscribe. Admins without a subscription subscribe for free like before. Projects assigned by
   an admin open without NPS points (as before; the card now says so).
3. **Finished projects** (progress 100%): the bar becomes a flowing neon-blue bar that fades in
   and out (`.dq-neon-bar`, still with reduced motion), a "completed and ready to use" badge
   replaces "100%", and the card gets a cooler, higher-contrast, bevelled surface.
4. **Idea to project** (/admin-cp/community, "Convert to project"): creates a private plugin
   project named after the idea (unique slug), whose description holds the idea's text, its
   author, the number of votes and who voted, and the visible comments (`projectDescriptionFromIdea`,
   tested; at most 8000 characters, the project form allows the same), then deletes the idea with
   its picture, votes and comments. The project page reminds the admin that the description names
   members before it is made public.
5. **Full screen.** `FullscreenButton` (@devquake/ui) in the site header, the control panel and
   the apps' toolbars; hidden where the browser has no Fullscreen API (iPhone Safari).

## Consequences

- Positive: one menu everywhere; no path into an app without a subscription or trial.
- Negative: converted projects publish voter names and comments once made public; the admin
  must review the description first (shown on the project page).
- Negative: the neon blue is the one colour outside the brand palette, reserved for "finished".

# Brand

## The mark: "Cracked Q"

A letter Q whose ring is split by a jagged crack. The crack runs through the ring and leaves it
as the Q's tail, drawn as a seismograph spike. It combines the two halves of the name: **dev** (a
solid platform) and **quake** (the energy breaking through it).

- The **ring** follows the text colour: ink on light backgrounds, paper on dark ones.
- The **tail** is always Quake orange (except in single-colour use).
- The **cracks** are real gaps, so the mark works on any background, including transparent.

Design exploration and the other concepts: the "DevQuake Logo Concepts" design canvas
(Hybrid C).

## Colours

| Token          | Hex       | CSS variable | Tailwind          | Use                               |
| -------------- | --------- | ------------ | ----------------- | --------------------------------- |
| Ink            | `#16181D` | `--dq-ink`   | `bg-ink` etc.     | Text, dark backgrounds, dark half |
| Paper          | `#F4F1EA` | `--dq-paper` | `bg-paper` etc.   | Light backgrounds, mark on dark   |
| Quake (orange) | `#E4572E` | `--dq-quake` | `text-quake` etc. | Seismic tail, accents, highlights |

Contrast: Quake orange reaches about 3.3:1 on Paper, 3.7:1 on white and 4.8:1 on Ink. Use it
for the mark, large text (24 px and up), icons and borders, not for small body text on light
backgrounds.

## Typography

| Role     | Typeface                  | Notes                                                          |
| -------- | ------------------------- | -------------------------------------------------------------- |
| Wordmark | Bricolage Grotesque, 800  | lowercase "dev" in the text colour, "quake" in orange, -0.02em |
| UI text  | System UI stack (for now) | To be revisited when a full design system is created           |

The host loads Bricolage Grotesque with `next/font/google` (`--font-bricolage`), exposed as
`--font-brand` and the Tailwind class `font-display`.

## Using the logo in code

```tsx
import { DevQuakeLogo, DevQuakeMark } from '@devquake/ui';

<DevQuakeLogo size={40} />                  // mark + wordmark
<DevQuakeMark size={24} />                  // mark only, accessible name "DevQuake"
<DevQuakeMark size={20} title="" />         // decorative (next to visible text)
<DevQuakeMark size={24} mono />             // single colour (tail in the text colour too)
```

Plugins use the same components (`@devquake/ui`), for example in the "back to DevQuake" link
of `templates/plugin/src/layout.tsx`.

## Brand in the UI

- `Button` (`@devquake/ui`): primary is Ink on light / Paper on dark; focus ring in Quake orange.
- Admin control panel (`/admin-cp`): Paper / Ink page surfaces, an Ink header bar with
  `DevQuakeLogo`, Quake-orange progress bars, active-nav underline and focus rings, and
  Bricolage Grotesque for page headings and stat numbers. Small text stays Ink / Paper.

## Light, dark and adaptive themes

Every header has a theme picker: **Adaptive** (default, follows the device), **Light** and
**Dark**. The choice is stored in the `dq_theme` cookie (shared with all `*.devquake.com` apps,
not set for Adaptive) and rendered by the server as `<html data-theme="light|dark">`.
Write colours with Tailwind's `dark:` variant as usual: `globals.css` redefines it so a forced
theme wins over the device setting. Never use `@media (prefers-color-scheme)` directly in
components. On phones the header shows the mark only, so the toolbar fits.

## Email images

Email clients block SVG and web fonts, so emails use PNGs rendered from the real assets by
`scripts/render-email-images.mjs` (3× resolution):

| File                                       | Use                                        |
| ------------------------------------------ | ------------------------------------------ |
| `apps/host/public/brand/email-logo.png`    | Logo bar of every email (200×40 displayed) |
| `apps/host/public/brand/email-welcome.png` | Welcome banner (560×200 displayed)         |

Both sit on Ink and always have alt text, so emails stay readable when images are blocked.
Re-render them after any change to the mark, colours or wordmark.

## Files

| File                                               | Purpose                                         |
| -------------------------------------------------- | ----------------------------------------------- |
| `apps/host/public/brand/devquake-mark.svg`         | Mark for light backgrounds                      |
| `apps/host/public/brand/devquake-mark-inverse.svg` | Mark for dark backgrounds                       |
| `apps/host/public/brand/devquake-mark-mono.svg`    | Single-colour mark (stamps, embossing, fax)     |
| `apps/host/public/brand/devquake-app-icon.svg`     | App icon: mark on an ink tile                   |
| `apps/host/src/app/icon.svg`                       | Favicon, switches colours in dark mode          |
| `apps/host/src/app/favicon.ico`                    | Fallback favicon (16, 32, 48 px)                |
| `apps/host/src/app/apple-icon.png`                 | iOS home-screen icon (180 px)                   |
| `apps/host/public/icons/icon-192.png`, `-512.png`  | PWA icons (see `apps/host/src/app/manifest.ts`) |
| `apps/host/public/icons/icon-maskable-512.png`     | Android adaptive icon (extra safe-zone padding) |

All plugin subdomains are served by the host, so they share these icons automatically.

## Rules

- Clear space around the mark: at least the thickness of the ring on every side.
- Minimum size: 16 px on screen. Below 24 px use the mark without the wordmark.
- Do not rotate, stretch, outline or add effects (shadows, gradients) to the mark.
- Do not close the cracks or detach the tail from the ring.
- Do not recolour the ring or the tail, apart from the single-colour version.
- At 16 px the cracks disappear; that is expected. Do not thicken them for small sizes.
- Do not place the mark on busy photos; use a solid Ink or Paper area behind it.

## QR codes

Every QR code (landing page, `/qr` download, referral links, invitation emails, app invites)
comes from one generator: `brandedQrSvg` in `@devquake/ui/qr` (inline SVG) and `brandedQrPng`
in `apps/host/src/lib/qr-png.ts` (PNG for emails and downloads). Ink modules on white, error
correction level H, and the mark on a white rounded plate in the centre. The plate covers less
than 10% of the code (level H tolerates about 30%); `qr-png.test.ts` decodes every size with a
real QR reader. Keep the modules dark on white in both themes, and do not enlarge the logo past
the test's limit.

## Before registering the brand

The mark was designed from scratch, but similarity to existing marks cannot be ruled out. Before
using it commercially or registering it, search EUIPO eSearch or TMview (EU and Romanian OSIM
trademarks), the WIPO Global Brand Database, and a reverse image search, and consider a check by
an IP lawyer.

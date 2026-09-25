# @devquake/ui

Shared, presentational React components used by the host and all plugins.

- Components must be server-component safe by default (no hooks). If a component needs state,
  put `'use client'` at the top of that file only.
- Styling: Tailwind utility classes only. The host scans this folder via `@source` in `globals.css`.
- No business logic, no data fetching, no plugin-specific components.
- Export everything through `src/index.ts`.
- Exceptions, on purpose:
  - `src/mark.ts` — the logo geometry and brand colours as plain data (used by the logo and QR).
  - `src/qr.ts` — branded QR codes (`brandedQrSvg`, `brandedQrLayout`), exported only as the
    server-side subpath `@devquake/ui/qr` (it depends on `qrcode`; never import it in a client
    component).
  - `src/release-notes.tsx` — `ReleaseNotes`, a client component showing a plugin's changelog in
    a dialog (ADR 0008).
  - `src/analytics.ts` — `trackEvent()`: a GA event, only after consent (ADR 0009). No personal
    data in parameters.
  - `src/datetime.ts` — `formatDateTime`, `localDateTimeToUtc`, `utcOffsetMinutes`: every
    timestamp shown to people goes through these, in the viewer's zone (ADR 0010).

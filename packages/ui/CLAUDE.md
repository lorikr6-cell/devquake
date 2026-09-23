# @devquake/ui

Shared, presentational React components used by the host and all plugins.

- Components must be server-component safe by default (no hooks). If a component needs state,
  put `'use client'` at the top of that file only.
- Styling: Tailwind utility classes only. The host scans this folder via `@source` in `globals.css`.
- No business logic, no data fetching, no plugin-specific components.
- Export everything through `src/index.ts`.

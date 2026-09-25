# ADR 0010: Dates and times in the viewer's time zone

Status: accepted · 2026-09-25

## Context

Pages are rendered on the server, which runs in UTC, so every timestamp was shown in UTC
("14:03 UTC"). People should see their own local time, in the host and in every app.

## Decision

- **Store UTC, show local.** Every timestamp in every database is UTC (connections run in UTC;
  `UTC_TIMESTAMP()` / `CURRENT_TIMESTAMP`). It is converted only when shown.
- The browser's IANA zone is kept in the `dq_tz` cookie (all `*.devquake.com` sites) by
  `TimeZoneSync` in the root layout; when it is missing or changes, the page re-renders once.
  The server reads it with `getTimeZone()` (UTC until known).
- Format timestamps with `formatDateTime(value, timeZone, style)` from `@devquake/ui`, or the
  host's `<DateTime value={...} />` server component. Never a fixed `timeZone: 'UTC'` and never a
  "UTC" suffix for a timestamp.
- Apps get the zone as `ctx.timeZone` (additive, optional SDK field).
- **Input goes back to UTC**: a date and time a person types (e.g. `datetime-local`) is
  converted with `localDateTimeToUtc(value, timeZone)` on the server before it is stored.
- **Calendar dates are not times**: `DATE` columns (an idea's target date, a shopping list's
  day) are shown exactly as stored and never shifted. "Today" for such dates is the viewer's
  day (`todayIn(ctx.timeZone)` in the shopping app).
- Day-based statistics are grouped by the viewer's day (`CONVERT_TZ` with a numeric offset from
  `utcOffsetMinutes()`, which needs no MySQL time-zone tables). Exception: the public visit
  counts, which are stored as one total per UTC day and cannot be re-bucketed.

## Consequences

- The first page of a first visit may show UTC for a moment before it re-renders.
- Relative times ("5 min ago") need no zone.

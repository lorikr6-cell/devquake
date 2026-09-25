# Plugin index

Every plugin keeps its own detailed docs in `plugins/<id>/README.md` and `plugins/<id>/CLAUDE.md`.
Built plugins are appended to the first table automatically by `pnpm new:plugin`; keep the status
column current.

## Built

| Subdomain  | Name                  | Docs                                                 | Status                                    |
| ---------- | --------------------- | ---------------------------------------------------- | ----------------------------------------- |
| `shopping` | Shared shopping lists | [plugins/shopping](../../plugins/shopping/README.md) | active (v0.7.0)                           |
| `workout`  | Workout tracker       | [plugins/workout](../../plugins/workout/README.md)   | own routines, plan and reminders (v0.7.0) |

## Planned

Ideas are specified in [ideas/](ideas/). Priorities and platform prerequisites are in the
[roadmap](../roadmap.md). Move a plugin to the Built table when it is scaffolded.

| Proposed subdomain | Name                 | Idea doc                         | Status |
| ------------------ | -------------------- | -------------------------------- | ------ |
| `bills`            | Utility bill manager | [ideas/bills.md](ideas/bills.md) | idea   |
| `darts`            | Dart game manager    | [ideas/darts.md](ideas/darts.md) | idea   |
| `pulse`            | Realtime events API  | [ideas/pulse.md](ideas/pulse.md) | idea   |

# Plugin index

Every plugin keeps its own detailed docs in `plugins/<id>/README.md` and `plugins/<id>/CLAUDE.md`.
Built plugins are appended to the first table automatically by `pnpm new:plugin`; keep the status
column current.

## Built

| Subdomain | Name    | Docs                                               | Status |
| --------- | ------- | -------------------------------------------------- | ------ |
| `example` | Example | [plugins/example](../../plugins/example/README.md) | active |

## Planned

Ideas are specified in [ideas/](ideas/). Priorities and platform prerequisites are in the
[roadmap](../roadmap.md). Move a plugin to the Built table when it is scaffolded.

| Proposed subdomain | Name                  | Idea doc                               | Status |
| ------------------ | --------------------- | -------------------------------------- | ------ |
| `bills`            | Utility bill manager  | [ideas/bills.md](ideas/bills.md)       | idea   |
| `darts`            | Dart game manager     | [ideas/darts.md](ideas/darts.md)       | idea   |
| `pulse`            | Realtime events API   | [ideas/pulse.md](ideas/pulse.md)       | idea   |
| `workout`          | Workout tracker       | [ideas/workout.md](ideas/workout.md)   | idea   |
| `shopping`         | Shared shopping lists | [ideas/shopping.md](ideas/shopping.md) | idea   |

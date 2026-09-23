# Working with Claude Code

Claude Code reads its configuration from the repo, so everyone on the team gets the same setup.

| File                          | Purpose                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `CLAUDE.md` (root)            | Project memory: stack, commands, rules, doc policy. Loaded every session.          |
| `*/CLAUDE.md`                 | Local rules, loaded when Claude works in that folder (host, sdk, ui, each plugin). |
| `.claude/settings.json`       | Shared permissions (allowed commands, protected files).                            |
| `.claude/settings.local.json` | Your personal overrides (git-ignored).                                             |
| `.claude/agents/*.md`         | Subagents with their own context and tool limits.                                  |
| `.claude/skills/*/SKILL.md`   | Slash-command workflows.                                                           |

## Agents

| Agent            | Use it for                                                            |
| ---------------- | --------------------------------------------------------------------- |
| `architect`      | Planning features, SDK/routing changes, ADRs. Writes only to `docs/`. |
| `plugin-builder` | Creating plugins and implementing features inside them.               |
| `test-engineer`  | Writing/running Vitest tests.                                         |
| `code-reviewer`  | Read-only review of the current diff.                                 |
| `docs-keeper`    | Keeping docs, READMEs, CHANGELOGs, CLAUDE.md accurate.                |

Claude delegates automatically based on each agent's description, or ask explicitly:
"Use the architect agent to plan a comments feature for the blog plugin."
Manage them with `/agents`. Agents are loaded at session start — restart the session after
editing agent files by hand.

## Skills

`/new-plugin <id> "Name" [description]`, `/adr <title>`, `/update-docs [scope]`, `/review`, `/ship`.

## Recommended loop for a feature

1. "Plan X" → architect produces a plan (and ADR if needed). Review it.
2. "Implement the plan" → plugin-builder.
3. "Add tests" → test-engineer.
4. `/review` → fix blocking items.
5. `/update-docs`, then `/ship`.

## Tips

- Use Plan Mode for anything touching `packages/plugin-sdk` or `apps/host/src/proxy.ts`.
- Keep the root `CLAUDE.md` short; put detail in `docs/` and the per-folder `CLAUDE.md` files.
- Put personal preferences in `CLAUDE.local.md` (git-ignored).

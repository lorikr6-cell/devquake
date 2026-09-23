---
name: ship
description: Prepare and commit the current work (checks, docs, conventional commit, optional push). Use when the user says ship it, commit this, or push.
disable-model-invocation: true
---

1. Run `pnpm format`, `pnpm typecheck`, `pnpm test`. Stop and report if anything fails.
2. Check documentation was updated for the change (see "Documentation policy" in CLAUDE.md);
   if not, run the `docs-keeper` agent first.
3. Show `git status` and propose one or more Conventional Commit messages
   (`type(scope): summary`, scopes: host, sdk, ui, plugin-<id>, docs, infra).
4. After the user approves, `git add` the relevant files and commit.
5. Ask before `git push`. Never force-push. If on `main`, suggest a feature branch + PR instead.

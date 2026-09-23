---
name: update-docs
description: Sync documentation with recent code changes. Use after finishing a feature or when docs seem stale.
argument-hint: [scope, e.g. a plugin id or "host"]
---

Update documentation for: ${ARGUMENTS:-all uncommitted changes}

Delegate to the `docs-keeper` agent with the scope above and the output of `git diff --stat`.
When it returns, summarise which docs changed for the user.

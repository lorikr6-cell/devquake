---
name: new-plugin
description: Scaffold a new DevQuake plugin on its own subdomain. Use when the user asks to create/add a new plugin, module or subdomain app.
argument-hint: <id> [Display Name] [short description of what it does]
---

Create a new plugin: $ARGUMENTS

1. Validate the id: lowercase letters, digits, dashes, 2–32 chars, not in `RESERVED`
   (`scripts/generate-registry.mjs`), and `plugins/<id>` must not exist.
2. Run `pnpm new:plugin <id> "<Display Name>"`, then `pnpm install`.
3. If a description was given, fill `manifest.description` in `plugins/<id>/src/index.ts`,
   the intro of `plugins/<id>/README.md`, and the "Plugin-specific notes" of its `CLAUDE.md`.
4. Run `pnpm typecheck`.
5. Tell the user the local URL `http://<id>.localhost:3000` and suggest next steps. If they
   described features, offer to hand off to the `plugin-builder` agent (after an `architect`
   plan for anything non-trivial).

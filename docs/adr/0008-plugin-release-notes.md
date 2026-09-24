# ADR 0008: Plugin release notes from CHANGELOG.md

Status: accepted · 2026-09-24

## Context

Every plugin keeps a `CHANGELOG.md` (required by the plugin rules). Users should see which
version of an app they are using and what changed, both inside the app and on the project cards
of devquake.com, without every plugin re-implementing it.

## Decision

- `scripts/generate-registry.mjs` embeds each plugin's `CHANGELOG.md` text in
  `apps/host/src/plugins/registry.changelog.generated.ts` at build time (plugins are not read
  from disk at runtime; the deploy bundle has no source files).
- The SDK gets `parseChangelog(markdown)` and the `PluginChangelogEntry` type
  (`version`, optional `date`, `notes`). It understands `## 0.3.0`, `## 0.3.0 — date` and
  `## [0.3.0] - date` headings with `-`/`*` bullets (wrapped lines continue a bullet).
- Additive context field: `PluginContext.changelog?: PluginChangelogEntry[]`, newest first.
- `@devquake/ui` gets `ReleaseNotes`: a `v1.2.0` button opening the notes in a dialog. The host
  shows it on project cards; plugins show it in their own layout.

## Consequences

- The latest version shown is the first heading in `CHANGELOG.md`, so the changelog must be
  updated with every release (it already had to be). `manifest.version` should match it.
- Notes are plain text with `**bold**` and `` `code` `` only; nothing is rendered as HTML.

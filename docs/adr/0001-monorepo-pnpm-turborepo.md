# 0001 — Monorepo with pnpm workspaces and Turborepo

- Status: Accepted
- Date: 2026-09-23

## Context

The host and many plugins must be developed as separate projects but share types, UI and a
deployment. The team works in one Git repo.

## Decision

Use a single monorepo with pnpm workspaces (`apps/*`, `packages/*`, `plugins/*`) and Turborepo
for task orchestration and caching.

## Consequences

- Atomic changes across SDK and plugins; one CI; strict dependency isolation via pnpm.
- Each plugin has its own package.json, docs and changelog.
  − All plugins share one repo's access control; splitting a plugin out later requires moving it.

## Alternatives considered

- One repo per plugin with published npm packages: heavy versioning overhead early on.
- Nx: more features than needed today.

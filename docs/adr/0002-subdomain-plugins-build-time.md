# 0002 — Subdomain plugins as build-time workspace packages

- Status: Accepted
- Date: 2026-09-23

## Context

Plugins must run on their own subdomain and behave like separate projects, while being part
of the host architecture.

## Decision

Plugins are workspace packages that default-export a `PluginDefinition` (SDK). A generator
builds a registry of lazy loaders. `proxy.ts` rewrites `<id>.devquake.com` to generic
`plugin-host`/`plugin-api` routes that dispatch to the plugin by route pattern.

## Consequences

- Type-safe contract, one deployment, shared UI/auth, lazy loading per plugin.
- Adding a plugin needs no host code changes.
  − Adding/updating a plugin requires a rebuild and redeploy of the host.
  − Plugins share the host's Next.js/React versions.

## Alternatives considered

- Next.js Multi-Zones (separate app per plugin): stronger isolation, but separate deployments
  and no shared runtime. Remains the escape hatch for plugins that outgrow the host.
- Runtime-loaded remote plugins (module federation / uploaded bundles): complex and a
  security risk for server code.

# Plugin: **PLUGIN_NAME** (`__PLUGIN_ID__`)

Served on `__PLUGIN_ID__.devquake.com`. Contract: `packages/plugin-sdk/src/types.ts`.
Full guide: `docs/guides/creating-a-plugin.md`.

## Rules for this plugin

- All routes are declared in `src/index.ts` (`pages` and `api`). A file that is not declared
  there is not reachable. Patterns: `/`, `/posts/:id`, `/docs/*rest`.
- Page modules: default-export a component receiving `PluginPageProps`; optionally export
  `metadata` or `generateMetadata`.
- API modules: export `GET`/`POST`/... typed as `PluginApiHandler`. Served under `/api/...`.
- Import ONLY from: this plugin, `@devquake/plugin-sdk`, `@devquake/ui`, `next`, `react`,
  and this plugin's own dependencies. Never import from `apps/host` or another plugin.
- Links inside the plugin are root-relative (`/about`), because the browser URL is the subdomain.
- Keep `README.md` route table and `CHANGELOG.md` updated with every change. `CHANGELOG.md` is
  shown to users (ADR 0008): plain-language entries, and the first `## x.y.z` heading must equal
  `manifest.version` in `src/index.ts`.

## Plugin-specific notes

<!-- Document domain concepts, data sources and decisions for this plugin here. -->

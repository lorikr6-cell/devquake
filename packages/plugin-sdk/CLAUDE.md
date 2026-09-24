# @devquake/plugin-sdk

The **public contract** between the host app and every plugin. Treat it like a published API.

- Any change to `src/types.ts` is potentially breaking for every plugin. Before changing it:
  1. Check all usages in `apps/host` and `plugins/*` (grep for the type name).
  2. Prefer additive, optional fields over renames/removals.
  3. Record the decision in `docs/adr/` and update `docs/architecture/plugin-system.md`.
- Keep this package dependency-free at runtime (types from `next`/`react` only).
- `router.ts` and `changelog.ts` (`parseChangelog`, ADR 0008) must stay pure and fully covered
  by their tests. Run `pnpm --filter @devquake/plugin-sdk test`.
- Context fields so far (all optional, additive): `user`, `db`, `people` (ADR 0007),
  `changelog` (ADR 0008); platform hooks `getStats` and `deleteUserData` (ADR 0007); manifest
  `database` (ADR 0007) and `publicPages` (ADR 0009).

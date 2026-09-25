# Workout tracker

DevQuake app served at `https://workout.devquake.com`. Idea and planned features:
[docs/plugins/ideas/workout.md](../../docs/plugins/ideas/workout.md).

**Status: placeholder (0.1.0).** The app is set up for deployment only: it greets the signed-in
DevQuake user and shows a fixed sample week (`src/lib/sample.ts`). Nothing is stored and it has
no database yet.

Signing in is shared with DevQuake: the session cookie is set for `.devquake.com`, and the host
only lets the project's subscribers, assigned users and admins in (ADR 0006). The app itself
never asks for credentials.

## Routes

| Type | Pattern   | File                 | Purpose                               |
| ---- | --------- | -------------------- | ------------------------------------- |
| Page | `/`       | `src/pages/home.tsx` | Greeting, sample week, what is coming |
| API  | `/health` | `src/api/health.ts`  | Liveness                              |

## Languages

English, German, Romanian and Hungarian (ADR 0011). Every route also exists under `/de`, `/ro`
and `/hu`. Texts: `src/i18n/screens.ts` (catalog test in `src/i18n/catalog.test.ts`). Release
notes: `CHANGELOG.md` plus `CHANGELOG.de.md`, `.ro.md`, `.hu.md`.

## Going live

The platform database already has the `workout` project (migration 0004, plugin id `workout`).

1. Merge to `main`; CI builds and Hostinger redeploys `devquake.com`.
2. Hostinger: create the subdomain `workout`, the DNS record if needed, the SSL certificate and
   `public_html/workout/.htaccess` (a copy of `public_html/shopping/.htaccess`; the
   `DEVQUAKE_ENV_FILE` line is the same). See the deployment guide, "App subdomains on
   Hostinger". The shared `devquake.env` needs no new variables while the app has no database.
3. Restart the app subdomains: touch `hbuilds/current/nodejs/tmp/restart.txt`.
4. `/admin-cp/projects` → **Workout tracker**: tick **Public** and **Online**, save. Set the
   **NPS cost** if it should not be FREE (owner only).
5. Check: `https://workout.devquake.com/api/health` answers with JSON (401 when signed out),
   and the page greets you by name after subscribing on devquake.com.

When the app gets its own database: add `database: true` to the manifest, the schema in
`db/migrations/`, and `WORKOUT_DB_NAME`, `WORKOUT_DB_USER`, `WORKOUT_DB_PWD` in hPanel **and**
`devquake.env` (see `plugins/shopping` and `db/README.md` → "App databases").

## Development

```bash
pnpm dev                                    # from the repo root
pnpm --filter @devquake/plugin-workout test
```

Open `http://workout.lvh.me:3000` with `ROOT_DOMAIN=lvh.me:3000` so the DevQuake session is
shared with the app (plain `localhost` cookies are host-only).

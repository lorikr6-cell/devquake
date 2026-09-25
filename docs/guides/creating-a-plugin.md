# Creating a plugin

## 1. Scaffold

```powershell
pnpm new:plugin blog "Blog"
pnpm install
pnpm dev          # open http://blog.localhost:3000
```

Or ask Claude: `/new-plugin blog "Blog" A developer blog with posts and tags`.

## 2. Add a page

`plugins/blog/src/pages/post.tsx`

```tsx
import type { Metadata } from 'next';
import type { PluginPageProps } from '@devquake/plugin-sdk';

export async function generateMetadata({ params }: PluginPageProps): Promise<Metadata> {
  return { title: `Post ${params.id}` };
}

export default async function Post({ params }: PluginPageProps) {
  return <h1>Post {params.id}</h1>;
}
```

Register it in `src/index.ts`: `'/posts/:id': () => import('./pages/post')`.

## 3. Add an API endpoint

`plugins/blog/src/api/posts.ts`

```ts
import type { PluginApiHandler } from '@devquake/plugin-sdk';

export const GET: PluginApiHandler = async () => Response.json([{ id: 1 }]);

export const POST: PluginApiHandler = async (request) => {
  const body = await request.json().catch(() => null);
  if (!body?.title) return Response.json({ error: 'title required' }, { status: 400 });
  return Response.json({ ok: true }, { status: 201 });
};
```

Register: `api: { '/posts': () => import('./api/posts') }` → `blog.devquake.com/api/posts`.

## 4. Interactive components

Put `'use client'` at the top of the component file (e.g. `src/components/like-button.tsx`) and
use it from a server page.

## 5. Signed-in user, own database and platform hooks (optional)

Every page and API handler receives `ctx`:

- `ctx.user` — the signed-in user (`id`, `displayName`, `isAdmin`) or `null`. No email.
- `ctx.db` — the app's **own** MySQL database (`query`, `execute`, `transaction`), when the
  manifest has `database: true` and `<ID>_DB_NAME/_USER/_PWD` are set. Schema files go in
  `plugins/<id>/db/migrations/` (re-runnable; apply with `pnpm db:migrate --plugin <id>`).
- `ctx.people.referrals()` — people the user invited to DevQuake (and who invited them).
- `ctx.changelog` — the app's own `CHANGELOG.md`, parsed.
- `ctx.session` — `expiresAt` and `extend(hours)`: keep the sign-in alive during long active
  use (API handlers only; never past 24 hours after sign-in). See ADR 0014.
- `ctx.app` — `name` and `iconUrl` of the app's project logo: show the icon next to the app's
  name in the toolbar (`<img src={ctx.app.iconUrl} alt="" />`). See ADR 0016.

Optional `platform: () => import('./platform')` with named exports `getStats` (numbers for the
admin dashboard) and `deleteUserData` (called when a user deletes their account, **unsubscribes
from the app, or tried it for 24 hours and did not subscribe within 30 days** (ADR 0016): remove or anonymise everything they created). Details: ADR 0007
and `plugins/shopping` as the reference.

A `scheduled` export runs background work at most once an hour (from traffic, or the cron
call `/api/scheduled`); it gets `db`, `baseUrl`, `now` and `mail.sendToUser(userId, compose)`,
which emails a user in their language without showing the app their address. Keep it
idempotent. Details: ADR 0014; `plugins/workout/src/platform.ts` (monthly email) as the
reference.

## 6. Public pages and analytics (optional)

- `publicPages: [{ path: '/help', title: 'User manual' }]` in the manifest makes those exact
  pages readable without an account and indexable (sitemap, robots.txt, project card). Keep
  them informational: no members' data, no API calls (ADR 0009).
- Google Analytics already tags every page with your app. To count what people do, call
  `trackEvent('item_added', { source: 'typed' })` from `@devquake/ui` in client components.
  It does nothing without consent. Never send names, emails or contents.

## 7. Languages

DevQuake is in English, German, Romanian and Hungarian (ADR 0011). The host puts the language
in the URL (`/de/...`, English has no prefix), strips it before your routes are matched and
passes it as `ctx.locale`; the `LanguagePicker` from `@devquake/ui` belongs in your toolbar
(the template has it).

- Keep your texts in a catalog per language (`defineMessages(en, { de, ro, hu })`, see
  `plugins/shopping/src/i18n/`), wrap the layout in an `I18nProvider` with it, and use
  `useT(namespace)` in client components and a translator built from `ctx.locale` on the
  server. Add a catalog test like `plugins/shopping/src/i18n/catalog.test.ts`.
- Links: `Link` from `@devquake/ui` instead of `next/link`; for `router.push` and `redirect`,
  pass the path through `localizePath(path, locale)`.
- Dates and money: format with `LOCALE_TAGS[locale]`.
- API errors: throw keys and translate them where the response is made (the API gets the
  visitor's language in `ctx.locale` too).
- Release notes: `CHANGELOG.de.md`, `CHANGELOG.ro.md`, `CHANGELOG.hu.md` are optional; when
  present, they must have the same versions as `CHANGELOG.md` (the version test checks it).

## 8. Dependencies

`pnpm --filter @devquake/plugin-blog add <package>` — dependencies belong to the plugin, not
the host.

## 9. Before merging

Update `README.md` route table and `CHANGELOG.md`, run `pnpm typecheck && pnpm test`, and
use `/review`.

`CHANGELOG.md` is **shown to users**: the app's version button and the project card open it
(ADR 0008). Write entries in plain language, keep technical details (migrations, tables) in
the README, and keep the first `## x.y.z` heading equal to `manifest.version`.

**Every bug fix or feature is a new version.** Bump `manifest.version` (`src/index.ts`) and
`package.json` — patch (`0.5.0` → `0.5.1`) for fixes, minor (`0.5.1` → `0.6.0`) for features —
and add a new entry at the top of `CHANGELOG.md`. Released entries are history: never edit or
reuse them. `src/version.test.ts` (part of the template) fails when the versions disagree or
the changelog is out of order. Then run `node scripts/generate-registry.mjs`.

## 10. Go live

A merged plugin is deployed but **not reachable** until it is switched on:

1. In `/admin-cp/projects`, create (or open) its project and set **Subdomain / plugin id** to the
   plugin id.
2. Connect `<id>.devquake.com` to the app on Hostinger: subdomain, DNS, SSL, the `.htaccess`
   copy and the shared settings file (deployment guide → "App subdomains on Hostinger"). If
   the app has a database, create it, add `<ID>_DB_*` (hPanel and `devquake.env`) and import
   its migrations.
3. Tick **Public** and **Online** and save. The landing page now shows an **Open** button on
   the project card. (A private project cannot be online.)

Untick **Online** to take the app offline again; its URL then returns 404. Local development
without a database serves every plugin.

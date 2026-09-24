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

Optional `platform: () => import('./platform')` with named exports `getStats` (numbers for the
admin dashboard) and `deleteUserData` (called when a user deletes their account **or
unsubscribes from the app**: remove or anonymise everything they created). Details: ADR 0007
and `plugins/shopping` as the reference.

## 6. Public pages and analytics (optional)

- `publicPages: [{ path: '/help', title: 'User manual' }]` in the manifest makes those exact
  pages readable without an account and indexable (sitemap, robots.txt, project card). Keep
  them informational: no members' data, no API calls (ADR 0009).
- Google Analytics already tags every page with your app. To count what people do, call
  `trackEvent('item_added', { source: 'typed' })` from `@devquake/ui` in client components.
  It does nothing without consent. Never send names, emails or contents.

## 7. Dependencies

`pnpm --filter @devquake/plugin-blog add <package>` — dependencies belong to the plugin, not
the host.

## 8. Before merging

Update `README.md` route table and `CHANGELOG.md`, run `pnpm typecheck && pnpm test`, and
use `/review`.

`CHANGELOG.md` is **shown to users**: the app's version button and the project card open it
(ADR 0008). Write entries in plain language, keep technical details (migrations, tables) in
the README, and keep the first `## x.y.z` heading equal to `manifest.version`.

## 9. Go live

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

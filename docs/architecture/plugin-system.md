# Plugin system

Source of truth: `packages/plugin-sdk/src/types.ts`.

## Anatomy of a plugin

```
plugins/blog/
├─ package.json      "devquake": { "plugin": true, "subdomain": "blog" }
├─ src/index.ts      default export definePlugin({...})
├─ src/layout.tsx    optional wrapper for every page
├─ src/pages/*.tsx   page modules
├─ src/api/*.ts      API modules (GET/POST/...)
├─ README.md  CHANGELOG.md  CLAUDE.md
```

## The definition

```ts
export default definePlugin({
  manifest: { id: 'blog', name: 'Blog', version: '0.1.0', status: 'active' },
  layout: () => import('./layout'),
  pages: {
    '/': () => import('./pages/home'),
    '/posts/:id': () => import('./pages/post'),
    '/docs/*rest': () => import('./pages/docs'),
  },
  api: {
    '/posts': () => import('./api/posts'), // blog.devquake.com/api/posts
    '/posts/:id': () => import('./api/post'), // blog.devquake.com/api/posts/42
  },
});
```

**Route patterns**: static (`/about`), params (`/posts/:id`), splat (`/docs/*rest`, value is the
remaining path). Most specific wins: static > param > splat.

**Page module**: `export default function Page({ params, searchParams, ctx }: PluginPageProps)`,
optional `export const metadata` or `export async function generateMetadata(props)`.
Pages are React Server Components; they can be `async` and fetch data directly.

**API module**: `export const GET: PluginApiHandler = (request, { params, ctx }) => Response`.

**Context** (`ctx`): `pluginId`, `rootDomain`, `baseUrl` (this plugin's absolute URL),
`hostUrl` (main site URL), and since ADR 0007: `user` (signed-in user: `id`, `displayName`,
`isAdmin`, or null), `db` (the plugin's own MySQL database when `manifest.database` is set and
`<ID>_DB_*` is configured) and `people` (`referrals()`: the user's DevQuake referral network).
Since ADR 0008: `changelog` (the plugin's `CHANGELOG.md`, parsed, newest release first); show it
with `ReleaseNotes` from `@devquake/ui`. Keep the first `## x.y.z` heading equal to
`manifest.version`.

**Time zone** (ADR 0010): `ctx.timeZone` is the visitor's zone; show timestamps with
`formatDateTime` from `@devquake/ui`, store UTC.

**Public pages** (ADR 0009): `manifest.publicPages: [{ path: '/help', title: 'User manual' }]`
opens those exact pages to everyone (no sign-in or subscription), lists them in the app's
sitemap and robots.txt and links them from the project card. **Analytics**: every page is
tagged with its app automatically; send app events with `trackEvent()` from `@devquake/ui`
(no personal data).

**Platform hooks** (optional `platform: () => import('./platform')`, named exports):
`getStats(ctx)` for the admin dashboard and `deleteUserData(userId, ctx)` for account deletion.
See [ADR 0007](../adr/0007-plugin-databases-and-platform-hooks.md) and `plugins/shopping` for
the reference implementation.

## Lifecycle / registration

1. `pnpm new:plugin <id>` copies the template.
2. `pnpm registry` (also runs before `dev`, `build`, `typecheck`) scans `plugins/*`, validates
   ids (format, uniqueness, not reserved), writes `apps/host/src/plugins/*.generated.ts`, and
   adds the package to `apps/host/package.json`.
3. `pnpm install` links it. The host now serves it on its subdomain.

Disable a plugin without deleting it: `manifest.status = 'disabled'` (returns 404).

## Rules

- Plugins import only from themselves, the SDK, `@devquake/ui`, `next`, `react`, and own deps.
- Shared needs (auth, DB access, analytics) are added to the SDK/host as **capabilities** exposed
  through `ctx` — decided via ADR — never by importing host internals.
- Changes to the SDK must be backward compatible or versioned with an ADR.

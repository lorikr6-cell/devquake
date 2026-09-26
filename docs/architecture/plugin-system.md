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

**Signed-in routes, mail to non-subscribers, last activity** (ADR 0022): `manifest.signedInRoutes` lists page and API patterns any signed-in DevQuake user may use without access to the app (the app must check who may see what there); `manifest.mailWithoutAccess` lets `mail.sendToUser(id, compose, { withoutAccess: true })` reach members without access; the scheduled hook gets `lastActiveAt(userIds)` (DevQuake-wide activity). Used by My vault for its recipients.

**Platform hooks** (optional `platform: () => import('./platform')`, named exports):
`getStats(ctx)` for the admin dashboard, `deleteUserData(userId, ctx)` for account deletion, and
`scheduled(ctx)` for background work with `ctx.mail.sendToUser()` (ADR 0014; the host runs it
at most every 5 minutes from traffic or `GET /api/scheduled`). Pages and API handlers also get
`ctx.session` (`expiresAt`, `extend()`) to keep a sign-in alive during long active use, and
`ctx.app` (`name`, `iconUrl`): the project's logo, which apps show next to their name (the host
also uses it as the app's favicon; ADR 0016). Members without a subscription can try an app
once for 24 hours; `appAccess()` lets them in, and their data is removed through
`deleteUserData` 30 days after the trial if they do not subscribe.
See [ADR 0007](../adr/0007-plugin-databases-and-platform-hooks.md) and `plugins/shopping` for
the reference implementation.

## Lifecycle / registration

1. `pnpm new:plugin <id>` copies the template.
2. `pnpm registry` (also runs before `dev`, `build`, `typecheck`) scans `plugins/*`, validates
   ids (format, uniqueness, not reserved), writes `apps/host/src/plugins/*.generated.ts`, and
   adds the package to `apps/host/package.json`.
3. `pnpm install` links it. The host now serves it on its subdomain.

Disable a plugin without deleting it: `manifest.status = 'disabled'` (returns 404).

## Shared app chrome (`@devquake/ui`)

- **`AppToolbar`**: the toolbar of every app. The app's logo and name on the left take the room
  and link to the app's start page; on the right only full screen, the app's own buttons (for
  example a notification bell, passed as `actions`) and the DevQuake mark. The language picker
  shows only for visitors who are not signed in: members set language and theme in their
  DevQuake account (profile). The manual and the version notes (`ReleaseNotes`) belong in the
  app's footer. An optional second row (for example the workout app's sections) is its
  `children`.
- **`Sheet`**: dialogs and popups. Toolbars use a backdrop blur, which makes `position: fixed`
  relative to the toolbar, so anything opened from it would be cut off. `Sheet` renders on
  `<body>` (a portal), is never taller than the visible screen (portrait, landscape, notches)
  and scrolls inside; a bottom sheet on phones, a centred box on larger screens. Popups anchored
  to a toolbar button (like the shopping bell) also render on `<body>` and limit their height to
  the screen.

## Rules

- Plugins import only from themselves, the SDK, `@devquake/ui`, `next`, `react`, and own deps.
- Shared needs (auth, DB access, analytics) are added to the SDK/host as **capabilities** exposed
  through `ctx` — decided via ADR — never by importing host internals.
- Changes to the SDK must be backward compatible or versioned with an ADR.

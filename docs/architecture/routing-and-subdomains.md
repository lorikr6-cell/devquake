# Routing & subdomains

Implemented in `apps/host/src/proxy.ts` (Next.js 16's replacement for `middleware.ts`) and
`apps/host/src/lib/domain.ts`.

| Incoming                            | Rewritten to (internal)          |
| ----------------------------------- | -------------------------------- |
| `devquake.com/anything`             | unchanged → `src/app/anything`   |
| `www.devquake.com/...`              | unchanged (treated as root)      |
| `blog.devquake.com/`                | `/plugin-host/blog`              |
| `blog.devquake.com/posts/1?x=y`     | `/plugin-host/blog/posts/1?x=y`  |
| `blog.devquake.com/api/posts`       | `/plugin-api/blog/posts`         |
| `admin.devquake.com/...` (reserved) | unchanged (host decides)         |
| `unknown.devquake.com/`             | `/plugin-host/unknown` → 404     |
| `devquake.com/plugin-host/...`      | 404 (internal paths are blocked) |

The browser URL never changes. Client navigation with `<Link href="/about">` inside a plugin
works because every request on the subdomain passes through the proxy again.

## Configuration

`ROOT_DOMAIN` env var: `localhost:3000` in development, `devquake.com` in production.
`*.localhost` resolves to `127.0.0.1` in Chrome, Edge and Firefox, so `http://blog.localhost:3000`
works with no hosts-file changes.

## Reserved subdomains

Defined in `scripts/generate-registry.mjs` (`RESERVED`) and emitted into the generated manifest.
The generator refuses plugins that use them.

## Cross-subdomain concerns (future)

- Shared login: set session cookies with `Domain=.devquake.com`, `Secure`, `HttpOnly`,
  `SameSite=Lax`. Keep per-plugin cookies host-only.
- CORS between subdomains is required for browser `fetch` from one plugin to another's API.

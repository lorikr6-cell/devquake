# Deployment

## Hosting provider

| Item               | Value                                |
| ------------------ | ------------------------------------ |
| Provider           | Hostinger                            |
| Control panel      | hPanel                               |
| Domains management | https://hpanel.hostinger.com/domains |
| Domain             | `devquake.com`                       |

DNS records, subdomains, SSL certificates and the hosting plan for `devquake.com` are all managed
in hPanel. Credentials are never stored in this repository; ask the account owner for access.

## Hostinger managed Node.js (Business / Cloud plans) — current setup

Hostinger builds Node.js apps with npm, which cannot install our pnpm workspace. So the build
happens in GitHub Actions and Hostinger only runs the result:

```mermaid
flowchart LR
  A[push to main] --> B[CI: typecheck, test, build]
  B --> C[scripts/assemble-deploy.mjs]
  C --> D[force-push to 'deploy' branch]
  D --> E[Hostinger auto-deploys 'deploy']
```

The `deploy` branch contains only `server.js`, a minimal `package.json` (next, react, react-dom)
and the compiled app. Never edit it by hand; it is overwritten on every push to `main`.

### One-time setup in hPanel

1. Push `main` to GitHub and wait for the **CI** workflow to go green (Actions tab). The
   `deploy` branch now exists.
2. If `devquake.com` already has a website on the plan (e.g. a default PHP site), Hostinger
   requires removing it before a Node.js app can use the domain. Back it up first if it has
   anything you need.
3. hPanel → **Websites** → **Add Website** → **Deploy Web App** → **Import Git Repository**,
   authorise GitHub, pick the repository.
4. Build settings:
   | Setting          | Value                                              |
   | ---------------- | -------------------------------------------------- |
   | Branch           | `deploy`                                           |
   | Framework        | **Other** (not Next.js — the app is already built) |
   | Node.js version  | 22.x                                               |
   | Build command    | `npm run build` (a no-op) or none                  |
   | Output directory | `.` (repo root) if asked                           |
   | Entry file       | `server.js`                                        |
5. **Environment variables**: `ROOT_DOMAIN=devquake.com`.
6. Deploy and open https://devquake.com. Check **Deployments** → build log if it fails.

From then on: merge to `main` → CI → `deploy` branch → Hostinger redeploys automatically.

### Troubleshooting

**`Cannot find module .../corepack/.../pnpm.cjs` / "Failed to install dependencies"** — Hostinger
is building the `main` branch (the pnpm workspace) instead of `deploy`. Make sure the CI run on
`main` is green and the `deploy` branch exists on GitHub, then set the branch to `deploy` and
framework to **Other** in hPanel (website dashboard → Settings & Redeploy, or ⋮ → Change
repository) and redeploy.

### Plugin subdomains on managed hosting

Each plugin needs `<id>.devquake.com` to reach the **same** Node.js app. On Hostinger's managed
Node.js hosting this must be verified: try adding `example.devquake.com` to the app (hPanel →
the website → Domains) and open it. Hostinger's docs state wildcard SSL certificates are only
supported on VPS plans, so if individual subdomains can't be attached to the app, or you need
unlimited plugins without per-subdomain setup, move to a Hostinger **VPS** and follow the
generic Node.js + nginx instructions below.

### Test the bundle locally (optional)

```powershell
pnpm build
node scripts/assemble-deploy.mjs
cd .deploy; npm install; $env:ROOT_DOMAIN="localhost:3000"; $env:PORT="3000"; node server.js
```

## Requirements from the hosting plan

DevQuake is a Next.js server app. The host must provide:

1. **Node.js ≥ 20.9** with a long-running process (VPS, cloud server, or a panel with a
   "Node.js app" feature). Static-only/PHP-only shared hosting cannot run it.
2. **Wildcard DNS**: `*.devquake.com` pointing to the server.
3. **Wildcard TLS certificate** for `*.devquake.com` + `devquake.com` (Let's Encrypt via DNS-01
   challenge, or the provider's AutoSSL if it supports wildcards).

## DNS records

| Type  | Name  | Value          |
| ----- | ----- | -------------- |
| A     | `@`   | server IP      |
| A     | `*`   | server IP      |
| CNAME | `www` | `devquake.com` |

## Build

```bash
pnpm install --frozen-lockfile
ROOT_DOMAIN=devquake.com pnpm build
```

`output: 'standalone'` produces `apps/host/.next/standalone/`. Deploy that folder plus:

- `apps/host/.next/static` → `standalone/apps/host/.next/static`
- `apps/host/public` → `standalone/apps/host/public`

Run: `ROOT_DOMAIN=devquake.com PORT=3000 node apps/host/server.js` (from the standalone
folder), ideally under PM2 or systemd.

## Reverse proxy (nginx example)

```nginx
server {
  listen 443 ssl http2;
  server_name devquake.com .devquake.com;   # root + all subdomains
  ssl_certificate     /etc/letsencrypt/live/devquake.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/devquake.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;                 # required: routing uses the Host header
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

## Panel-based hosting (Hostinger hPanel, cPanel, Plesk)

- Create the Node.js application pointing to the standalone folder, startup file
  `apps/host/server.js`, env `ROOT_DOMAIN=devquake.com`.
- Create a **wildcard subdomain** `*.devquake.com` mapped to the same application.
- Confirm the plan allows wildcard subdomains and wildcard SSL; many entry-level plans do not.

## Alternative: Vercel

Add `devquake.com` and `*.devquake.com` to the project (wildcard requires Vercel nameservers),
set `ROOT_DOMAIN`, root directory `apps/host`. `output: 'standalone'` is ignored there.

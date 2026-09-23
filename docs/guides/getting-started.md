# Getting started (Windows)

## Prerequisites

- Node.js 22 LTS (≥ 20.9) — https://nodejs.org
- Git, VS Code, the **Claude Code** extension for VS Code
- A GitHub repository for the project

## First-time setup

```powershell
cd D:\Work\devquake
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
pnpm dev
```

- Host: http://localhost:3000
- Example plugin: http://example.localhost:3000 (API: http://example.localhost:3000/api/health)

## Troubleshooting

**`Cannot find matching keyid` from Corepack** — the Corepack bundled with older Node versions
has outdated npm signing keys. Fix: `npm install -g corepack@latest` and re-run the setup
script (the script now does this automatically). Fallback: `corepack disable` then
`npm install -g pnpm@latest`.

**Plugin subdomain doesn't load** — use `http://<id>.localhost:3000` (not `127.0.0.1`), and make
sure `apps/host/.env.local` has `ROOT_DOMAIN=localhost:3000`.

## Daily commands

| Command                                       | Does                                           |
| --------------------------------------------- | ---------------------------------------------- |
| `pnpm dev`                                    | Regenerates registry and starts the dev server |
| `pnpm new:plugin <id> "Name"`                 | Scaffolds a plugin                             |
| `pnpm typecheck` / `pnpm test` / `pnpm build` | Quality gates (also run in CI)                 |
| `pnpm format`                                 | Prettier                                       |

## Git workflow

- `main` is always deployable; work on branches: `feat/plugin-blog-comments`, `fix/host-proxy`.
- Conventional Commits: `feat(plugin-blog): add comments`, `fix(host): ...`, `docs: ...`.
- Open a PR; CI (`.github/workflows/ci.yml`) must be green before merge.

First push of this scaffold:

```powershell
git add .
git commit -m "chore: scaffold devquake monorepo, plugin system and claude config"
git branch -M main
git remote add origin https://github.com/<you>/devquake.git   # skip if already set
git push -u origin main
```

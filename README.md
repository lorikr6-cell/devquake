# DevQuake

Next.js 16 platform at **devquake.com** with a plugin system: every plugin is its own project
in `plugins/<id>/` and is served on its own subdomain, **`<id>.devquake.com`**.

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1   # first time
pnpm dev                                                      # http://localhost:3000
pnpm new:plugin blog "Blog"                                   # http://blog.localhost:3000
```

- Architecture: [docs/architecture/overview.md](docs/architecture/overview.md)
- Plugin guide: [docs/guides/creating-a-plugin.md](docs/guides/creating-a-plugin.md)
- Claude Code setup: [docs/guides/working-with-claude.md](docs/guides/working-with-claude.md)
- Deployment: [docs/guides/deployment.md](docs/guides/deployment.md)
- Database and control panel: [db/README.md](db/README.md)
- Apps: [docs/plugins/README.md](docs/plugins/README.md) (live: `shopping.devquake.com`)

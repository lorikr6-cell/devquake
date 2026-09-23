# DevQuake documentation

## Environments

| Environment | Host app              | Plugins                    | Deployed from             |
| ----------- | --------------------- | -------------------------- | ------------------------- |
| Local       | http://localhost:3000 | http://<id>.localhost:3000 | your working copy         |
| Production  | https://devquake.com  | https://<id>.devquake.com  | `main` via CI to `deploy` |

## Contents

| Section                                                                          | What's inside                                                  |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [architecture/overview.md](architecture/overview.md)                             | Big picture, monorepo layout, request flow                     |
| [architecture/plugin-system.md](architecture/plugin-system.md)                   | The plugin contract (SDK), lifecycle, rules                    |
| [architecture/routing-and-subdomains.md](architecture/routing-and-subdomains.md) | How `<id>.devquake.com` reaches plugin code                    |
| [guides/getting-started.md](guides/getting-started.md)                           | Local setup on Windows, daily workflow, Git                    |
| [guides/creating-a-plugin.md](guides/creating-a-plugin.md)                       | Step-by-step plugin development                                |
| [guides/working-with-claude.md](guides/working-with-claude.md)                   | Claude Code in VS Code: agents, skills, workflow               |
| [guides/deployment.md](guides/deployment.md)                                     | Hostinger setup, CI pipeline, verification, fixes              |
| [../db/README.md](../db/README.md)                                               | Database: tables, migrations, creating the admin, `/admin-cp`  |
| [roadmap.md](roadmap.md)                                                         | Planned plugins, platform prerequisites, analytics and revenue |
| [adr/](adr/README.md)                                                            | Architecture Decision Records                                  |
| [plugins/](plugins/README.md)                                                    | Index of all plugins                                           |

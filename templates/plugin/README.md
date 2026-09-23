# **PLUGIN_NAME**

DevQuake plugin served at `https://__PLUGIN_ID__.devquake.com`
(local: `http://__PLUGIN_ID__.localhost:3000`).

## Routes

| Type | Pattern   | File                  |
| ---- | --------- | --------------------- |
| Page | `/`       | `src/pages/home.tsx`  |
| Page | `/about`  | `src/pages/about.tsx` |
| API  | `/health` | `src/api/health.ts`   |

## Development

```bash
pnpm dev   # from the repo root, then open http://__PLUGIN_ID__.localhost:3000
```

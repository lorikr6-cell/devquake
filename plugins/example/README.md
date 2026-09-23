# Example

DevQuake plugin served at `https://example.devquake.com`
(local: `http://example.localhost:3000`).

## Routes

| Type | Pattern   | File                  |
| ---- | --------- | --------------------- |
| Page | `/`       | `src/pages/home.tsx`  |
| Page | `/about`  | `src/pages/about.tsx` |
| API  | `/health` | `src/api/health.ts`   |

## Development

```bash
pnpm dev   # from the repo root, then open http://example.localhost:3000
```

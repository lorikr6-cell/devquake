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

## 5. Dependencies

`pnpm --filter @devquake/plugin-blog add <package>` — dependencies belong to the plugin, not
the host.

## 6. Before merging

Update `README.md` route table and `CHANGELOG.md`, run `pnpm typecheck && pnpm test`, and
use `/review`.

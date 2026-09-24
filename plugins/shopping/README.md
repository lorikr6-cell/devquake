# Shared shopping lists

DevQuake app served at `https://shopping.devquake.com`. The pilot for ADR 0007: it has its own
MySQL database and reads the platform only through the SDK (`ctx.user`, `ctx.db`, `ctx.people`).

Users create shared shopping carts, add items with quantity, unit, price per unit and a
description, and group them by **store**. Each store has a name, a **type**, a **location** and a
description. Typing a well-known chain fills the type in automatically (Kaufland → grocery,
Dedeman → hardware and DIY, Altex → consumer electronics; see `src/lib/store-types.ts`).
Owners invite people with a link, code or QR, or add people from their **DevQuake referral
network** (people they invited, and the person who invited them) with one click.

## Routes

| Type | Pattern                      | File                    | Purpose                                             |
| ---- | ---------------------------- | ----------------------- | --------------------------------------------------- |
| Page | `/`                          | `src/pages/home.tsx`    | My lists, create a list, join by code               |
| Page | `/join/:code`                | `src/pages/join.tsx`    | Invitation: shows the list and a Join button        |
| Page | `/lists/:id`                 | `src/pages/list.tsx`    | The cart: add items and stores, shopping mode       |
| Page | `/lists/:id/share`           | `src/pages/share.tsx`   | Invite link/QR, referral friends, members, settings |
| API  | `/health`                    | `src/api/health.ts`     | Liveness                                            |
| API  | `/lists`                     | `src/api/lists.ts`      | GET my lists, POST create                           |
| API  | `/join`                      | `src/api/join.ts`       | POST `{ code }`                                     |
| API  | `/lists/:id`                 | `src/api/list.ts`       | GET (`?v=` → 204 if unchanged), PATCH, DELETE       |
| API  | `/lists/:id/items`           | `src/api/items.ts`      | POST item                                           |
| API  | `/lists/:id/items/:itemId`   | `src/api/item.ts`       | PATCH (fields, `done`), DELETE                      |
| API  | `/lists/:id/stores`          | `src/api/stores.ts`     | POST store (type guessed if omitted)                |
| API  | `/lists/:id/stores/:storeId` | `src/api/store.ts`      | PATCH, DELETE (items keep, without store)           |
| API  | `/lists/:id/clear-done`      | `src/api/clear-done.ts` | POST: remove ticked-off items                       |
| API  | `/lists/:id/invite`          | `src/api/invite.ts`     | GET active code, POST new code (owner)              |
| API  | `/lists/:id/members`         | `src/api/members.ts`    | POST `{ userId }` from the referral network (owner) |
| API  | `/lists/:id/members/:userId` | `src/api/member.ts`     | DELETE: owner removes, member leaves                |

Platform hooks (`src/platform.ts`): `getStats` (lists, people, items, stores on the admin
dashboard) and `deleteUserData` (lists pass to the longest-standing member or are deleted,
memberships removed, names taken off items).

## Database

Own database, configured with `SHOPPING_DB_NAME`, `SHOPPING_DB_USER`, `SHOPPING_DB_PWD`
(optional `SHOPPING_DB_HOST`/`SHOPPING_DB_PORT`). Schema: `db/migrations/`, applied with
`pnpm db:migrate --plugin shopping` or in phpMyAdmin. See `db/README.md` → "App databases".

## Development

```bash
pnpm dev                                    # from the repo root
pnpm --filter @devquake/plugin-shopping test
```

Open `http://shopping.lvh.me:3000` with `ROOT_DOMAIN=lvh.me:3000` so the DevQuake session is
shared with the app (plain `localhost` cookies are host-only).

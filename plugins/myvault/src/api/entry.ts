import { api } from '../lib/api';
import { deleteEntry, renameEntry, requireOwnEntry } from '../lib/data';
import { category, id, readBody, text } from '../lib/validate';

// GET /api/entries/:id: the owner's view of an entry (no content: opening is a counted try).
export const GET = api(async ({ params, db, user }) => requireOwnEntry(db, id(params.id), user.id));

// PATCH /api/entries/:id { title, category }: the owner renames it.
export const PATCH = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  await renameEntry(
    db,
    id(params.id),
    user.id,
    text(body.title, 'title', 120),
    category(body.category),
  );
});

// DELETE /api/entries/:id: the owner deletes it for good, with its tries and recipients.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteEntry(db, id(params.id), user.id);
});

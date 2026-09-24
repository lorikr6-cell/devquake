import { api } from '../lib/api';
import { createList, listsForUser } from '../lib/data';
import { currency, readBody, requiredText } from '../lib/validate';

// GET /api/lists: my lists. POST /api/lists { name, currency }: create one.
export const GET = api(async ({ db, user }) => ({ lists: await listsForUser(db, user.id) }));

export const POST = api(async ({ request, db, user }) => {
  const body = await readBody(request);
  const id = await createList(
    db,
    user,
    requiredText(body.name, 'List name', 80),
    currency(body.currency),
  );
  return Response.json({ id }, { status: 201 });
});

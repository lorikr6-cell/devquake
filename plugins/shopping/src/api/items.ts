import { api } from '../lib/api';
import { addItem } from '../lib/mutations';
import { id, itemInput, readBody } from '../lib/validate';

// POST /api/lists/:id/items { name, quantity?, unit?, price?, description?, storeId? }
export const POST = api(async ({ request, params, db, user }) => {
  const input = itemInput(await readBody(request));
  const itemId = await addItem(db, id(params.id, 'list'), user, input);
  return Response.json({ id: itemId }, { status: 201 });
});

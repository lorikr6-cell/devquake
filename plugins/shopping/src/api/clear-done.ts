import { api } from '../lib/api';
import { clearDone } from '../lib/mutations';
import { id } from '../lib/validate';

// POST /api/lists/:id/clear-done: removes every ticked-off item.
export const POST = api(async ({ params, db, user }) => ({
  removed: await clearDone(db, id(params.id, 'list'), user),
}));

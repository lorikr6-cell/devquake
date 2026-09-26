import { api } from '../lib/api';
import { unlockEntry } from '../lib/data';
import { id } from '../lib/validate';

// POST /api/entries/:id/unlock: the owner lifts a lock after reviewing the tries.
export const POST = api(async ({ params, db, user }) => {
  await unlockEntry(db, id(params.id), user.id);
});

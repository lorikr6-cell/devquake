import { api } from '../lib/api';
import { deleteSession, getSession } from '../lib/data';
import { id } from '../lib/validate';

// GET /api/sessions/:id: the workout with its exercises and sets.
export const GET = api(async ({ params, db, user }) => getSession(db, user.id, id(params.id)));

// DELETE /api/sessions/:id: discards the workout and what was entered in it.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteSession(db, user.id, id(params.id));
});

import { api } from '../lib/api';
import { catalogueBySlug, createOwnRoutine } from '../lib/own-routines';
import { routineInput } from '../lib/routine-input';
import { readBody } from '../lib/validate';

// POST /api/routines { name, location, items }: creates one of the person's own routines.
export const POST = api(async ({ request, db, user }) => {
  const bySlug = await catalogueBySlug(db);
  const input = routineInput(await readBody(request), bySlug);
  const id = await createOwnRoutine(db, user.id, input, bySlug);
  return Response.json({ id }, { status: 201 });
});

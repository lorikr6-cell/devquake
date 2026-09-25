import { api } from '../lib/api';
import { catalogueBySlug, deleteOwnRoutine, updateOwnRoutine } from '../lib/own-routines';
import { routineInput } from '../lib/routine-input';
import { id, readBody } from '../lib/validate';

// PUT /api/routines/:id: saves changes to an own routine (suggested routines cannot be changed).
export const PUT = api(async ({ request, params, db, user }) => {
  const bySlug = await catalogueBySlug(db, user.id);
  const input = routineInput(await readBody(request), bySlug);
  await updateOwnRoutine(db, user.id, id(params.id), input, bySlug);
});

// DELETE /api/routines/:id: deletes an own routine and its place in the plan.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteOwnRoutine(db, user.id, id(params.id));
});

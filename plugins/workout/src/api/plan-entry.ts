import { api } from '../lib/api';
import { deletePlanEntry, savePlanEntry } from '../lib/own-routines';
import { planInput } from '../lib/routine-input';
import { id, readBody } from '../lib/validate';

// PUT /api/plan/:id: moves or changes a slot (same checks as adding one).
export const PUT = api(async ({ request, params, db, user }) => {
  await savePlanEntry(db, user.id, planInput(await readBody(request)), id(params.id));
});

// DELETE /api/plan/:id: removes a slot from the plan (the routine stays).
export const DELETE = api(async ({ params, db, user }) => {
  await deletePlanEntry(db, user.id, id(params.id));
});

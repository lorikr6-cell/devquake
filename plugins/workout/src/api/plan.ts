import { api } from '../lib/api';
import { savePlanEntry } from '../lib/own-routines';
import { planInput } from '../lib/routine-input';
import { readBody } from '../lib/validate';

// POST /api/plan { routineId, weekday ('daily' | 1–7), start 'HH:MM', duration }: adds a slot
// to the plan; 409 when it overlaps another slot on the same day.
export const POST = api(async ({ request, db, user }) => {
  const id = await savePlanEntry(db, user.id, planInput(await readBody(request)));
  return Response.json({ id }, { status: 201 });
});

import { api } from '../lib/api';
import { startSession } from '../lib/data';
import { id, readBody } from '../lib/validate';

// POST /api/sessions { routineId }: starts a workout (409 while another one is running).
export const POST = api(async ({ request, db, user }) => {
  const body = await readBody(request);
  const sessionId = await startSession(db, user.id, id(body.routineId));
  return Response.json({ id: sessionId }, { status: 201 });
});

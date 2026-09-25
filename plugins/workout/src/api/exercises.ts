import { api } from '../lib/api';
import { exerciseInput } from '../lib/exercise-input';
import { createOwnExercise } from '../lib/own-exercises';
import { readBody } from '../lib/validate';

// POST /api/exercises: creates one of the person's own exercises (ADR 0019).
export const POST = api(async ({ request, db, user }) => {
  const id = await createOwnExercise(db, user.id, exerciseInput(await readBody(request)));
  return Response.json({ id }, { status: 201 });
});

import { api } from '../lib/api';
import { exerciseInput } from '../lib/exercise-input';
import { deleteOwnExercise, updateOwnExercise } from '../lib/own-exercises';
import { id, readBody } from '../lib/validate';

// PUT /api/exercises/:id: saves changes to an own exercise.
export const PUT = api(async ({ request, params, db, user }) => {
  await updateOwnExercise(db, user.id, id(params.id), exerciseInput(await readBody(request)));
});

// DELETE /api/exercises/:id: deletes an own exercise (409 while a routine uses it).
export const DELETE = api(async ({ params, db, user }) => {
  await deleteOwnExercise(db, user.id, id(params.id));
});

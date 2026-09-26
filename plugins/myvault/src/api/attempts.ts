import { api } from '../lib/api';
import { attemptsFor } from '../lib/data';
import { id } from '../lib/validate';

// GET /api/entries/:id/attempts: every try on the owner's entry (answers of failed ones).
export const GET = api(async ({ params, db, user }) => attemptsFor(db, id(params.id), user.id));

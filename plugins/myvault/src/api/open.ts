import { api } from '../lib/api';
import { entryForOpening } from '../lib/data';
import { id } from '../lib/validate';

// GET /api/open/:id: what someone needs to open an entry (title, questions, lock), for its
// owner and, once released, its recipients. Open to every signed-in member (ADR 0022).
export const GET = api(async ({ params, db, user }) => {
  const access = await entryForOpening(db, id(params.id), user.id);
  return { entry: access.entry, questions: access.questions, isOwner: access.isOwner };
});

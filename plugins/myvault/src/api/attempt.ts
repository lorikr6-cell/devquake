import { api } from '../lib/api';
import { attempt } from '../lib/data';
import { id, readBody } from '../lib/validate';

// POST /api/open/:id/attempt { vaultKey, answers }: a (counted) try to open an entry. Answers
// the encrypted content, which the browser decrypts; 403 wrong, 423 locked for 36 hours.
export const POST = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  return attempt(db, id(params.id), user, body.vaultKey, body.answers);
});

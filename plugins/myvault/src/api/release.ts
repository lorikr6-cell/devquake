import { api } from '../lib/api';
import { setRelease } from '../lib/data';
import { id, readBody, releaseInput } from '../lib/validate';

// PUT /api/entries/:id/release { recipients, inactiveDays, notBefore, vaultKey }: who gets the
// vault key and when. With recipients the vault key is required (checked, then sealed).
export const PUT = api(async ({ request, params, db, user, people }) => {
  const body = await readBody(request);
  await setRelease(db, id(params.id), user, people, releaseInput(body), body.vaultKey);
});

import { api } from '../lib/api';
import { replaceContent } from '../lib/data';
import { id, readBody, sealedInput } from '../lib/validate';

// PUT /api/entries/:id/content { vaultKey, answers, salt, iv, ciphertext }: the owner saves
// changed content, re-encrypted in the browser. The key and answers are checked like a try.
export const PUT = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  await replaceContent(db, id(params.id), user, body.vaultKey, body.answers, sealedInput(body));
});

import { api } from '../lib/api';
import { createEntry, ownEntries, sharedWithMe } from '../lib/data';
import { category, keyCheckHex, questions, readBody, sealedInput, text } from '../lib/validate';

// GET /api/entries: my entries and the ones released to me.
export const GET = api(async ({ db, user }) => ({
  own: await ownEntries(db, user.id),
  shared: await sharedWithMe(db, user.id),
}));

// POST /api/entries: a new entry, encrypted in the browser. The body has the title, category,
// the three questions, the answers (only hashed here), the key's check value and the
// ciphertext; never the vault key itself (it is sent only when recipients are set).
export const POST = api(async ({ request, db, user }) => {
  const body = await readBody(request);
  const id = await createEntry(db, user, {
    title: text(body.title, 'title', 120),
    category: category(body.category),
    questions: questions(body.questions),
    answers: body.answers,
    keyCheck: keyCheckHex(body.keyCheck),
    sealed: sealedInput(body),
  });
  return Response.json({ id }, { status: 201 });
});

import { api } from '../lib/api';
import { applyOps } from '../lib/data';
import { id, readBody, sessionOps } from '../lib/validate';

// POST /api/sessions/:id/ops { ops: SessionOp[] }: the workout screen's changes, in order (set
// results, next exercise, finish). Safe to repeat. Also sent with navigator.sendBeacon when the
// page is hidden, which is why this is a POST.
export const POST = api(async ({ request, params, db, user }) => {
  await applyOps(db, user.id, id(params.id), sessionOps(await readBody(request)));
});

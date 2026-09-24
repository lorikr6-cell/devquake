import { api } from '../lib/api';
import { eventsForUser } from '../lib/data';

// GET /api/events[?after=<id>]: what other people did on the user's lists (in-app
// notifications), newest first. With `after` only newer events.
export const GET = api(async ({ request, db, user }) => {
  const after = Number(new URL(request.url).searchParams.get('after'));
  const since = Number.isSafeInteger(after) && after > 0 ? after : null;
  return { events: await eventsForUser(db, user.id, since, since === null ? 20 : 30) };
});

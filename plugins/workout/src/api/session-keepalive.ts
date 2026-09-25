import { api } from '../lib/api';
import { activeSession } from '../lib/data';
import { id } from '../lib/validate';

/** Extend the sign-in when it ends within this many minutes. */
const EXTEND_BELOW_MINUTES = 120;

// POST /api/sessions/:id/keepalive: sent every few minutes by the workout screen. The request
// itself keeps the sign-in from going idle; while this workout is running and the sign-in ends
// within two hours, it is extended (ADR 0014: at most 24 hours after signing in).
export const POST = api(async ({ params, db, user, session }) => {
  const running = await activeSession(db, user.id);
  let expiresAt = session?.expiresAt ?? null;
  if (running?.id === id(params.id) && session) {
    const left = new Date(session.expiresAt).getTime() - Date.now();
    if (left < EXTEND_BELOW_MINUTES * 60_000) expiresAt = await session.extend(3);
  }
  return { expiresAt, active: running?.id === id(params.id) };
});

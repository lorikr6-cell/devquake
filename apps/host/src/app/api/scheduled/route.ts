import { timingSafeEqual } from 'node:crypto';
import { maybeRunScheduled } from '@/lib/plugin-scheduler';

/**
 * Optional cron entry point for the apps' scheduled work (ADR 0014):
 *   GET https://devquake.com/api/scheduled   with header  Authorization: Bearer <CRON_SECRET>
 * Without CRON_SECRET the endpoint is off; the work then only runs from site traffic.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const given = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const ok =
    !!secret &&
    given.length === secret.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ ran: await maybeRunScheduled(true) });
}

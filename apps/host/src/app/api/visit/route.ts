import { getRootHostname } from '@/lib/domain';
import { getRequestInfo } from '@/lib/request';
import { recordVisit } from '@/lib/visits';

/**
 * Anonymous page-view beacon for the root domain (see src/lib/visits.ts). Only same-origin
 * browser requests count; everything else is ignored with 204 so it reveals nothing.
 */
export async function POST(request: Request) {
  const host = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '')
    .split(':')[0]!
    .toLowerCase();
  const sameOrigin = request.headers.get('sec-fetch-site') === 'same-origin';
  if (host === getRootHostname() && sameOrigin) {
    await recordVisit(await getRequestInfo());
  }
  return new Response(null, { status: 204 });
}

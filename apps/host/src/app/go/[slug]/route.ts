import { followReferral } from '@/lib/external-referrals';
import { isSafeReferralUrl } from '@/lib/external-referral-rules';

/**
 * /go/<slug>: an external referral (ADR 0021). Counts the visit (a number, nobody's identity) and
 * sends the visitor to the partner. QR codes point here, so they keep working when the partner
 * link changes.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = /^[a-z0-9-]{1,40}$/.test(slug) ? await followReferral(slug) : null;
  if (!url || !isSafeReferralUrl(url)) return new Response('Not found', { status: 404 });
  return new Response(null, {
    status: 302,
    headers: { Location: url, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
  });
}

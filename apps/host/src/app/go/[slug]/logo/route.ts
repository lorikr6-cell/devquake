import { getReferralLogo } from '@/lib/external-referrals';

/**
 * A partner's logo (ADR 0021), versioned by ?v= so it can be cached for long. Uploads are checked
 * (lib/external-referral-rules.ts checkLogo); the headers keep an SVG from running anything even
 * when opened on its own.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const logo = /^[a-z0-9-]{1,40}$/.test(slug) ? await getReferralLogo(slug) : null;
  if (!logo) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(logo.data), {
    headers: {
      'Content-Type': logo.type,
      'Cache-Control': 'public, max-age=604800',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}

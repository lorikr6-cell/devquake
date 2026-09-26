import { hostUrl } from '@/lib/domain';
import { referralExists } from '@/lib/external-referrals';
import { brandedQrPng } from '@/lib/qr-png';

/** A high-resolution PNG QR code of /go/<slug> (with the DevQuake mark), to download or print. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,40}$/.test(slug) || !(await referralExists(slug))) {
    return new Response('Not found', { status: 404 });
  }
  const png = brandedQrPng(`${hostUrl()}/go/${slug}`, 1024);
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
      'Content-Disposition': `inline; filename="devquake-${slug}-qr.png"`,
    },
  });
}

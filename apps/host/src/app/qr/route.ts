import { hostUrl } from '@/lib/domain';
import { brandedQrPng } from '@/lib/qr-png';

/** High-resolution PNG QR code of the landing page (logo in the middle), for posters and slides. */
export async function GET() {
  const png = brandedQrPng(`${hostUrl()}/`, 1024);
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
      'Content-Disposition': 'inline; filename="devquake-qr.png"',
    },
  });
}

import QRCode from 'qrcode';
import { hostUrl } from '@/lib/domain';

/** High-resolution PNG QR code of the landing page, for posters and slides. */
export async function GET() {
  const png = await QRCode.toBuffer(`${hostUrl()}/`, {
    width: 1024,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#16181D', light: '#FFFFFF' },
  });
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
      'Content-Disposition': 'inline; filename="devquake-qr.png"',
    },
  });
}

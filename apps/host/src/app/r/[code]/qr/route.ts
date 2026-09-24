import QRCode from 'qrcode';
import { REFERRAL_CODE_PATTERN, referralUrl } from '@/lib/referrals';

/**
 * PNG QR code of an invite link (used on the account page and in invitation emails, where
 * SVG and data: images are blocked). The code is not secret: it is what the QR encodes.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!REFERRAL_CODE_PATTERN.test(code)) return new Response('Not found', { status: 404 });
  const png = await QRCode.toBuffer(referralUrl(code), {
    width: 480,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#16181D', light: '#FFFFFF' },
  });
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
      'Content-Disposition': `inline; filename="devquake-invite-${code}.png"`,
    },
  });
}

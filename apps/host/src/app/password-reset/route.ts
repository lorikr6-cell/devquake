import { getProtocol, hostUrl } from '@/lib/domain';
import { RESET_COOKIE_MAX_AGE, resetCookieName } from '@/lib/auth/password-reset';
import { localized } from '@/i18n/server';

/**
 * The link in the reset email: /password-reset?token=…
 * Moves the token into an HttpOnly cookie and forwards to /reset-password without it, so the
 * token never stays in the address bar, the history, analytics or a Referer header.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') ?? '';
  const target = new URL(await localized('/reset-password'), hostUrl());
  const headers = new Headers({
    Location: target.toString(),
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
  });
  if (token && token.length <= 100) {
    const secure = getProtocol() === 'https';
    headers.append(
      'Set-Cookie',
      `${resetCookieName()}=${encodeURIComponent(token)}; Path=/; Max-Age=${RESET_COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`,
    );
  }
  return new Response(null, { status: 303, headers });
}

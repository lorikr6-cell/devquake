import { hostUrl } from '@/lib/domain';
import { REF_COOKIE, REF_COOKIE_MAX_AGE, REFERRAL_CODE_PATTERN } from '@/lib/referrals';

/**
 * Invite link devquake.com/r/<code>: remembers who invited the visitor (cookie, 30 days) and
 * opens the landing page on "Create account". Unknown codes just open the landing page.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upper = code.toUpperCase();
  const headers = new Headers({
    Location: new URL('/?invited=1#signup', hostUrl()).toString(),
    'Cache-Control': 'no-store',
  });
  if (REFERRAL_CODE_PATTERN.test(upper)) {
    const secure = hostUrl().startsWith('https:') ? '; Secure' : '';
    headers.append(
      'Set-Cookie',
      `${REF_COOKIE}=${upper}; Max-Age=${REF_COOKIE_MAX_AGE}; Path=/; HttpOnly; SameSite=Lax${secure}`,
    );
  }
  return new Response(null, { status: 303, headers });
}

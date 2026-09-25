import { activateAccount } from '@/lib/auth/activation';
import { recordSnapshot } from '@/lib/auth/snapshot';
import { hostUrl } from '@/lib/domain';
import { getRequestInfo } from '@/lib/request';
import { localized } from '@/i18n/server';

/**
 * Activation link from the welcome email: /activate?token=…
 * Activates the account, then forwards to the sign-in card on the landing page with the
 * outcome (?activation=ok | already | expired | invalid). Never reveals which account it was.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') ?? '';
  const info = await getRequestInfo();
  let outcome: 'ok' | 'already' | 'expired' | 'invalid' = 'invalid';
  try {
    const result = await activateAccount(token, info);
    outcome = result.ok ? (result.alreadyActive ? 'already' : 'ok') : result.reason;
    await recordSnapshot({
      event: 'activate',
      outcome: outcome === 'ok' ? 'ok' : `activation_${outcome}`,
      context: 'site',
      userId: result.ok ? result.userId : null,
      info,
    });
  } catch (err) {
    console.error('[auth] activation failed', err);
    outcome = 'invalid';
  }
  const target = new URL(`${await localized('/')}?activation=${outcome}#account`, hostUrl());
  return new Response(null, {
    status: 303,
    headers: {
      Location: target.toString(),
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

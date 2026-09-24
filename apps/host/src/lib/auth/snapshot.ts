import 'server-only';
import { headers } from 'next/headers';
import { execute } from '../db';
import { maybeRunRetention } from '../retention';
import type { RequestContext } from '../mail/templates';
import { getRequestInfo, type RequestInfo } from '../request';
import { lookupIp } from './ip-intel';
import { parseUserAgent } from './user-agent';

/** Values the sign-in / sign-up forms add from the browser (hidden inputs). */
export interface ClientContext {
  timezone: string | null;
  language: string | null;
  screen: string | null;
}

export function readClientContext(form: FormData): ClientContext {
  const get = (name: string, max: number, pattern: RegExp) => {
    const v = String(form.get(name) ?? '').slice(0, max);
    return pattern.test(v) ? v : null;
  };
  return {
    timezone: get('client_tz', 64, /^[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+){0,2}$/),
    language: get('client_lang', 35, /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/),
    screen: get('client_screen', 20, /^\d{2,5}x\d{2,5}(?:@[\d.]+)?$/),
  };
}

export type SnapshotEvent = 'signup' | 'signin' | 'verify' | 'resend' | 'activate';

export interface SnapshotInput {
  event: SnapshotEvent;
  outcome: string;
  context: 'site' | 'admin-cp';
  email?: string | null;
  userId?: number | null;
  client?: ClientContext;
  info?: RequestInfo;
}

export interface SnapshotResult {
  /** Row id, or null if it could not be stored. */
  id: number | null;
  /** Human-readable location / device / network for security emails. */
  summary: RequestContext;
}

/**
 * Records who / when / where / which browser for one auth step. Never throws: auth must not
 * fail because of analytics. The MAC address is not part of it: it never leaves the
 * visitor's local network, so no website can read it.
 */
export async function recordSnapshot(input: SnapshotInput): Promise<SnapshotResult> {
  const empty: SnapshotResult = { id: null, summary: { location: null, device: null, vpn: null } };
  try {
    const info = input.info ?? (await getRequestInfo());
    const h = await headers();
    const ua = parseUserAgent(info.userAgent, {
      brands: h.get('sec-ch-ua'),
      platform: h.get('sec-ch-ua-platform'),
      mobile: h.get('sec-ch-ua-mobile'),
    });
    const intel = await lookupIp(info.ip);
    const client = input.client;
    const mismatch =
      client?.timezone && intel.timezone ? (client.timezone !== intel.timezone ? 1 : 0) : null;
    const summary: RequestContext = {
      location:
        [intel.city, intel.region !== intel.city ? intel.region : null, intel.country]
          .filter(Boolean)
          .join(', ') || null,
      device:
        [ua.browser && `${ua.browser}${ua.browserVersion ? ` ${ua.browserVersion}` : ''}`, ua.os]
          .filter(Boolean)
          .join(' on ') || null,
      vpn: intel.isProxy
        ? `${intel.proxyType ?? 'Proxy'}${intel.vpnOperator ? ` (${intel.vpnOperator})` : ''}${
            intel.country ? `, exit in ${intel.country}` : ''
          }`
        : null,
    };

    const result = await execute(
      `INSERT INTO auth_snapshots
         (event, outcome, user_id, email, context, ip, country_code, country, region, city,
          latitude, longitude, ip_timezone, asn, isp, is_proxy, proxy_type, vpn_operator,
          user_agent, browser, browser_version, os, device_type, accept_language,
          client_timezone, client_language, screen, timezone_mismatch)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.event,
        input.outcome.slice(0, 30),
        input.userId ?? null,
        input.email ?? null,
        input.context,
        info.ip,
        intel.countryCode,
        intel.country,
        intel.region,
        intel.city,
        intel.latitude,
        intel.longitude,
        intel.timezone,
        intel.asn,
        intel.isp,
        intel.isProxy == null ? null : intel.isProxy ? 1 : 0,
        intel.proxyType,
        intel.vpnOperator,
        info.userAgent,
        ua.browser,
        ua.browserVersion,
        ua.os,
        ua.deviceType,
        h.get('accept-language')?.slice(0, 100) ?? null,
        client?.timezone ?? null,
        client?.language ?? null,
        client?.screen ?? null,
        mismatch,
      ],
    );
    void maybeRunRetention();
    return { id: result.insertId, summary };
  } catch (err) {
    console.error('[auth] failed to record snapshot', err);
    return empty;
  }
}

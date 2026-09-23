import 'server-only';

/**
 * IP location and VPN/proxy detection via proxycheck.io (v2 API).
 * Without PROXYCHECK_API_KEY the free tier allows ~100 lookups per day; a free key raises it
 * to 1,000. Lookups fail open: sign-in never waits more than LOOKUP_TIMEOUT_MS or breaks
 * because of this service. Note: this sends visitor IPs to a third party (GDPR processor).
 *
 * For a VPN / proxy the location is where the VPN exit server is, not where the person is;
 * the person's real location behind a VPN cannot be determined from the IP.
 */
export interface IpIntel {
  countryCode: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  asn: string | null;
  isp: string | null;
  isProxy: boolean | null;
  proxyType: string | null;
  vpnOperator: string | null;
}

const LOOKUP_TIMEOUT_MS = 1500;

export const EMPTY_INTEL: IpIntel = {
  countryCode: null,
  country: null,
  region: null,
  city: null,
  latitude: null,
  longitude: null,
  timezone: null,
  asn: null,
  isp: null,
  isProxy: null,
  proxyType: null,
  vpnOperator: null,
};

/** Loopback, private, link-local and CGNAT ranges cannot be looked up. */
export function isPublicIp(ip: string | null): ip is string {
  if (!ip) return false;
  const v = ip.replace(/^::ffff:/, '');
  if (v === '::1' || v === '127.0.0.1' || v.startsWith('127.')) return false;
  if (/^(10\.|192\.168\.|169\.254\.)/.test(v)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(v)) return false;
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(v)) return false;
  if (/^(fc|fd|fe80)/i.test(v)) return false;
  return /^[\d.]+$/.test(v) || v.includes(':');
}

const str = (v: unknown, max: number) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export async function lookupIp(ip: string | null): Promise<IpIntel> {
  if (!isPublicIp(ip)) return EMPTY_INTEL;
  const key = process.env.PROXYCHECK_API_KEY;
  const url =
    `https://proxycheck.io/v2/${encodeURIComponent(ip)}?vpn=1&asn=1` +
    (key ? `&key=${encodeURIComponent(key)}` : '');
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
      cache: 'no-store',
    });
    if (!res.ok) return EMPTY_INTEL;
    const body = (await res.json()) as Record<string, unknown>;
    const d = body[ip] as Record<string, unknown> | undefined;
    if (!d) return EMPTY_INTEL;
    const operator = d.operator as Record<string, unknown> | undefined;
    return {
      countryCode: str(d.isocode, 2)?.toUpperCase() ?? null,
      country: str(d.country, 80),
      region: str(d.region, 80),
      city: str(d.city, 80),
      latitude: num(d.latitude),
      longitude: num(d.longitude),
      timezone: str(d.timezone, 64),
      asn: str(d.asn, 20),
      isp: str(d.provider, 120) ?? str(d.organisation, 120),
      isProxy: d.proxy === 'yes' ? true : d.proxy === 'no' ? false : null,
      proxyType: str(d.type, 30),
      vpnOperator: str(operator?.name, 80),
    };
  } catch {
    return EMPTY_INTEL;
  }
}

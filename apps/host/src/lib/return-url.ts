import { extractSubdomain, getProtocol, getRootDomain, getRootHostname } from './domain';

/** Cookie that remembers where to go after signing in (e.g. back to an app subdomain). */
export const RETURN_COOKIE = 'dq_return';
export const RETURN_COOKIE_MAX_AGE = 30 * 60;

/**
 * Returns `value` only if it is an absolute URL on DevQuake itself: the root domain or one of
 * its app subdomains, same protocol and port. Anything else (other sites, javascript:, nested
 * subdomains) returns null, so it can never be used as an open redirect.
 */
export function safeReturnUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value || value.length > 500) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== `${getProtocol()}:` || url.username || url.password) return null;
  const rootPort = getRootDomain().split(':')[1] ?? '';
  if (url.port !== rootPort) return null;
  const host = url.hostname.toLowerCase();
  if (host !== getRootHostname() && !extractSubdomain(url.host)) return null;
  return url.href;
}

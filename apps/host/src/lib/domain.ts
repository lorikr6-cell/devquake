/**
 * Everything related to domains/subdomains lives here so the proxy, pages and API
 * handlers agree on the rules. ROOT_DOMAIN is "devquake.com" in production and
 * "localhost:3000" in development (<id>.localhost resolves to 127.0.0.1 in modern browsers).
 */
export function getRootDomain(): string {
  return process.env.ROOT_DOMAIN ?? 'localhost:3000';
}

export function getRootHostname(): string {
  return getRootDomain().split(':')[0]!.toLowerCase();
}

/** Local development hosts. lvh.me resolves (with every subdomain) to 127.0.0.1. */
const LOCAL_ROOTS = ['localhost', 'lvh.me'];

export function isLocalRoot(): boolean {
  return LOCAL_ROOTS.includes(getRootHostname());
}

export function getProtocol(): 'http' | 'https' {
  return isLocalRoot() ? 'http' : 'https';
}

/**
 * Cookie Domain that covers the root and every app subdomain (".devquake.com"), so an app can
 * see who is signed in. Browsers refuse such a cookie on "localhost": there it stays host-only
 * (use ROOT_DOMAIN=lvh.me:3000 to test signed-in access to apps locally).
 */
export function sharedCookieDomain(): string | undefined {
  const root = getRootHostname();
  return root === 'localhost' ? undefined : `.${root}`;
}

/** True when app subdomains can see the session (every root except plain localhost). */
export function sessionSharedWithApps(): boolean {
  return sharedCookieDomain() !== undefined;
}

export function hostUrl(): string {
  return `${getProtocol()}://${getRootDomain()}`;
}

export function pluginUrl(pluginId: string): string {
  return `${getProtocol()}://${pluginId}.${getRootDomain()}`;
}

/**
 * Returns the first-level subdomain for a Host header, or null for the root domain,
 * "www", nested subdomains, or foreign hosts (e.g. preview deployments).
 */
export function extractSubdomain(hostHeader: string | null): string | null {
  if (!hostHeader) return null;
  const hostname = hostHeader.split(':')[0]!.toLowerCase();
  const root = getRootHostname();

  if (hostname === root || hostname === `www.${root}`) return null;
  if (!hostname.endsWith(`.${root}`)) return null;

  const sub = hostname.slice(0, -(root.length + 1));
  return sub.includes('.') ? null : sub;
}

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

export function getProtocol(): 'http' | 'https' {
  return getRootHostname() === 'localhost' ? 'http' : 'https';
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

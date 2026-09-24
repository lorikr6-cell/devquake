// Pure: used by the analytics component and tested on its own.

/**
 * Which part of DevQuake a page belongs to: "site" on the root domain (and www), otherwise the
 * app's subdomain ("shopping"). Sent to GA as the content group, so every app is reported
 * separately without any per-app setup.
 */
export function contentGroup(hostname: string, rootHostname: string): string {
  const host = hostname.toLowerCase();
  if (host === rootHostname || host === `www.${rootHostname}`) return 'site';
  if (!host.endsWith(`.${rootHostname}`)) return 'site';
  const sub = host.slice(0, -(rootHostname.length + 1));
  return /^[a-z0-9-]{1,32}$/.test(sub) ? sub : 'site';
}

import type { MetadataRoute } from 'next';
import { currentSite, siteOrigin } from '@/lib/seo';

export const dynamic = 'force-dynamic';

/**
 * /robots.txt per hostname. Private pages are kept out of search results with noindex
 * headers instead of being listed here: robots.txt is public, and /admin-cp must never appear.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await currentSite();
  const origin = siteOrigin(site);

  // App subdomains need a signed-in subscriber (ADR 0006): keep crawlers out entirely.
  if (site.kind === 'plugin') {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/account', '/verify', '/activate'],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}

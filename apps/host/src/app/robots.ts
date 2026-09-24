import type { MetadataRoute } from 'next';
import { appPublicPages, appSitemaps, currentSite, siteOrigin } from '@/lib/seo';

export const dynamic = 'force-dynamic';

/**
 * /robots.txt per hostname. Private pages are kept out of search results with noindex
 * headers instead of being listed here: robots.txt is public, and /admin-cp must never appear.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await currentSite();
  const origin = siteOrigin(site);

  // App subdomains are members-only (ADR 0006); crawlers may only read their public pages
  // (ADR 0009), which the app's own sitemap lists.
  if (site.kind === 'plugin') {
    const pages = await appPublicPages(site);
    if (pages.length === 0) return { rules: { userAgent: '*', disallow: '/' } };
    return {
      rules: { userAgent: '*', allow: pages.map((p) => p.path), disallow: '/' },
      sitemap: `${origin}/sitemap.xml`,
      host: origin,
    };
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/account', '/verify', '/activate', '/r/', '/avatar/'],
    },
    // The apps' sitemaps too, so search engines find their public pages.
    sitemap: [`${origin}/sitemap.xml`, ...(await appSitemaps().catch(() => []))],
    host: origin,
  };
}

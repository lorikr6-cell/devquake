import type { MetadataRoute } from 'next';
import { currentSite, sitemapEntries } from '@/lib/seo';

// Depends on the requesting hostname and on which apps are online.
export const dynamic = 'force-dynamic';

/** /sitemap.xml for devquake.com and for each online app subdomain (see src/lib/seo.ts). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return sitemapEntries(await currentSite());
}

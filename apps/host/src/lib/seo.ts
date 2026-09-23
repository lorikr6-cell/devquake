import 'server-only';
import { headers } from 'next/headers';
import { queryOne, type Row } from './db';
import { extractSubdomain, hostUrl, pluginUrl } from './domain';
import { PRIVACY_PATH, PRIVACY_POLICY_UPDATED } from './legal';
import { isPluginOnline, loadPlugin } from './plugins';
import { reservedSubdomains } from '@/plugins/registry.manifest.generated';

/**
 * /sitemap.xml and /robots.txt are served by the host on every hostname: the proxy does not
 * rewrite paths containing a dot, so <id>.devquake.com/sitemap.xml also lands here. Each
 * hostname describes only itself (a sitemap may only list URLs on its own host).
 *
 * Never list /admin-cp anywhere (not even as Disallow: robots.txt is public).
 */

export type SiteTarget = { kind: 'root' } | { kind: 'plugin'; id: string; online: boolean };

export async function currentSite(): Promise<SiteTarget> {
  const h = await headers();
  const sub = extractSubdomain(h.get('x-forwarded-host') ?? h.get('host'));
  if (!sub || (reservedSubdomains as readonly string[]).includes(sub)) return { kind: 'root' };
  const plugin = await loadPlugin(sub);
  return { kind: 'plugin', id: sub, online: !!plugin && (await isPluginOnline(sub)) };
}

export interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority?: number;
}

/** Latest change to anything the landing page shows (projects and their progress). */
async function landingLastModified(): Promise<Date | undefined> {
  if (!process.env.MAIN_DB_NAME) return undefined;
  try {
    const row = await queryOne<Row & { projects: Date | null; ideas: Date | null }>(
      `SELECT (SELECT MAX(updated_at) FROM projects WHERE is_public = 1) AS projects,
              (SELECT MAX(i.updated_at) FROM ideas i JOIN projects p ON p.id = i.project_id
                WHERE i.is_public = 1 AND p.is_public = 1) AS ideas`,
    );
    const times = [row?.projects, row?.ideas].filter((d): d is Date => d instanceof Date);
    return times.length ? new Date(Math.max(...times.map((d) => d.getTime()))) : undefined;
  } catch {
    return undefined;
  }
}

export async function sitemapEntries(site: SiteTarget): Promise<SitemapEntry[]> {
  if (site.kind === 'root') {
    return [
      {
        url: `${hostUrl()}/`,
        lastModified: await landingLastModified(),
        changeFrequency: 'weekly',
        priority: 1,
      },
      {
        url: `${hostUrl()}${PRIVACY_PATH}`,
        lastModified: new Date(`${PRIVACY_POLICY_UPDATED}T00:00:00Z`),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
    ];
  }

  // Offline or unknown apps are not reachable, so they have nothing to index.
  if (!site.online) return [];
  const plugin = await loadPlugin(site.id);
  if (!plugin) return [];
  // Only static routes ("/", "/about"); pages with :params or *rest need real ids.
  return Object.keys(plugin.pages)
    .filter((pattern) => !/[:*]/.test(pattern))
    .sort()
    .map((pattern) => ({
      url: `${pluginUrl(site.id)}${pattern === '/' ? '/' : pattern}`,
      changeFrequency: 'weekly' as const,
      priority: pattern === '/' ? 0.8 : 0.5,
    }));
}

export function siteOrigin(site: SiteTarget): string {
  return site.kind === 'root' ? hostUrl() : pluginUrl(site.id);
}

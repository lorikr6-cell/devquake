import { appIdentity } from '@/lib/app-icons';
import { loadPlugin } from '@/lib/plugins';
import { projectAvatarSvg } from '@/lib/project-avatar-svg';

/**
 * An app's icon: its project's logo as SVG (ADR 0016), used as the favicon on
 * <id>.devquake.com and in the app's toolbar. Public (logos are shown on the landing page too);
 * `?v=` changes with the logo, so it may be cached.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ plugin: string }> }) {
  const { plugin: id } = await params;
  const plugin = /^[a-z0-9-]{1,64}$/.test(id) ? await loadPlugin(id) : null;
  if (!plugin) return new Response('Not found', { status: 404 });
  const { look } = await appIdentity(id, plugin.manifest.name);
  return new Response(projectAvatarSvg(look), {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
      // The SVG is data only: no scripts, no external resources.
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}

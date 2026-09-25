import path from 'node:path';
import type { NextConfig } from 'next';
import { pluginPackages } from './src/plugins/registry.manifest.generated';

const repoRoot = path.resolve(process.cwd(), '../..');

const nextConfig: NextConfig = {
  // Self-contained server bundle for deployment on any Node host (VPS, cPanel Node app, Docker).
  output: 'standalone',
  outputFileTracingRoot: repoRoot,
  turbopack: { root: repoRoot },
  // Workspace packages ship TypeScript source; Next compiles them.
  // Local testing of app subdomains with a shared session: ROOT_DOMAIN=lvh.me:3000.
  allowedDevOrigins: ['lvh.me', '*.lvh.me'],
  transpilePackages: ['@devquake/plugin-sdk', '@devquake/ui', ...pluginPackages],
  // Community idea pictures go through a server action (shrunk in the browser to a few hundred
  // KB; the server accepts at most 1.5 MB). The default limit is 1 MB.
  experimental: { serverActions: { bodySizeLimit: '2mb' } },
  async headers() {
    // The admin control panel is unlisted: keep it out of search engines, caches and frames.
    const adminHeaders = [
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      { key: 'Cache-Control', value: 'private, no-store' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
      // same-origin, not no-referrer: no-referrer makes browsers send "Origin: null" on form
      // posts, which Next's Server Actions CSRF check rejects. same-origin still never reveals
      // /admin-cp to other sites.
      { key: 'Referrer-Policy', value: 'same-origin' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
    ];
    // Personal pages: never cached or indexed.
    const privateHeaders = [
      { key: 'X-Robots-Tag', value: 'noindex' },
      { key: 'Cache-Control', value: 'private, no-store' },
      { key: 'X-Frame-Options', value: 'DENY' },
    ];
    return [
      { source: '/admin-cp', headers: adminHeaders },
      { source: '/admin-cp/:path*', headers: adminHeaders },
      { source: '/account', headers: privateHeaders },
      { source: '/ideas', headers: privateHeaders },
      { source: '/ideas/:path*', headers: privateHeaders },
      { source: '/verify', headers: privateHeaders },
    ];
  },
};

export default nextConfig;

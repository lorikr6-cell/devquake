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
  transpilePackages: ['@devquake/plugin-sdk', '@devquake/ui', ...pluginPackages],
  // Loaded from node_modules at runtime; scripts/assemble-deploy.mjs adds it to the bundle.
  serverExternalPackages: ['mysql2'],
  async headers() {
    // The admin control panel is unlisted: keep it out of search engines, caches and frames.
    const adminHeaders = [
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      { key: 'Cache-Control', value: 'private, no-store' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
    ];
    return [
      { source: '/admin-cp', headers: adminHeaders },
      { source: '/admin-cp/:path*', headers: adminHeaders },
    ];
  },
};

export default nextConfig;

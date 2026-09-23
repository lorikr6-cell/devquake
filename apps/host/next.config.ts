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
};

export default nextConfig;

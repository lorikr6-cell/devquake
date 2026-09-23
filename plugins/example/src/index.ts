import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'example',
    name: 'Example',
    version: '0.1.0',
    description: 'Example plugin for DevQuake',
    status: 'active',
  },
  layout: () => import('./layout'),
  pages: {
    '/': () => import('./pages/home'),
    '/about': () => import('./pages/about'),
  },
  api: {
    '/health': () => import('./api/health'),
  },
});

import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: '__PLUGIN_ID__',
    name: '__PLUGIN_NAME__',
    version: '0.1.0',
    description: '__PLUGIN_NAME__ plugin for DevQuake',
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

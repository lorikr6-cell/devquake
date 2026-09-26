import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'myvault',
    name: 'My vault',
    version: '0.1.0',
    description:
      'Private information encrypted in your browser with a vault key and three questions only you can answer; optionally released to people you choose when you have been inactive for a while.',
    status: 'active',
    // Own MySQL database from MYVAULT_DB_* (ADR 0007).
    database: true,
    // Open to everyone and listed in the app's sitemap (ADR 0009).
    publicPages: [{ path: '/help', title: 'User manual' }],
    // Recipients open a released entry without subscribing to the app (ADR 0022).
    signedInRoutes: { pages: ['/open/:id'], api: ['/open/:id', '/open/:id/attempt'] },
    // The release email reaches recipients who have no access to the app (ADR 0022).
    mailWithoutAccess: true,
  },
  layout: () => import('./layout'),
  pages: {
    '/': () => import('./pages/home'),
    '/new': () => import('./pages/new'),
    '/entries/:id': () => import('./pages/entry'),
    '/open/:id': () => import('./pages/open'),
    '/help': () => import('./pages/help'),
  },
  api: {
    '/health': () => import('./api/health'),
    '/entries': () => import('./api/entries'),
    '/entries/:id': () => import('./api/entry'),
    '/entries/:id/release': () => import('./api/release'),
    '/entries/:id/content': () => import('./api/content'),
    '/entries/:id/unlock': () => import('./api/unlock'),
    '/entries/:id/attempts': () => import('./api/attempts'),
    '/open/:id': () => import('./api/open'),
    '/open/:id/attempt': () => import('./api/attempt'),
  },
  platform: () => import('./platform'),
});

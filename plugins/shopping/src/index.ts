import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'shopping',
    name: 'Shared shopping lists',
    version: '0.1.0',
    description:
      'Shared shopping carts: items grouped by store (type, location, description), prices and totals, shared with invite links or your DevQuake referrals.',
    status: 'active',
    // Own MySQL database from SHOPPING_DB_* (ADR 0007).
    database: true,
  },
  layout: () => import('./layout'),
  pages: {
    '/': () => import('./pages/home'),
    '/join/:code': () => import('./pages/join'),
    '/lists/:id': () => import('./pages/list'),
    '/lists/:id/share': () => import('./pages/share'),
  },
  api: {
    '/health': () => import('./api/health'),
    '/lists': () => import('./api/lists'),
    '/join': () => import('./api/join'),
    '/lists/:id': () => import('./api/list'),
    '/lists/:id/items': () => import('./api/items'),
    '/lists/:id/items/:itemId': () => import('./api/item'),
    '/lists/:id/stores': () => import('./api/stores'),
    '/lists/:id/stores/:storeId': () => import('./api/store'),
    '/lists/:id/clear-done': () => import('./api/clear-done'),
    '/lists/:id/invite': () => import('./api/invite'),
    '/lists/:id/members': () => import('./api/members'),
    '/lists/:id/members/:userId': () => import('./api/member'),
  },
  platform: () => import('./platform'),
});

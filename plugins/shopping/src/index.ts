import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'shopping',
    name: 'Shared shopping lists',
    version: '0.9.0',
    description:
      'Shared shopping carts planned by date: a calendar, items grouped by store (type, location, description), prices, totals and statistics, shared with invite links or your DevQuake referrals.',
    status: 'active',
    // Own MySQL database from SHOPPING_DB_* (ADR 0007).
    database: true,
    // Open to everyone and listed in the app's sitemap (ADR 0009).
    publicPages: [{ path: '/help', title: 'User manual' }],
  },
  layout: () => import('./layout'),
  pages: {
    '/': () => import('./pages/home'),
    '/join/:code': () => import('./pages/join'),
    '/lists/:id': () => import('./pages/list'),
    '/lists/:id/share': () => import('./pages/share'),
    '/help': () => import('./pages/help'),
  },
  api: {
    '/health': () => import('./api/health'),
    '/lists': () => import('./api/lists'),
    '/join': () => import('./api/join'),
    '/copy': () => import('./api/copy'),
    '/suggestions': () => import('./api/suggestions'),
    '/changes': () => import('./api/changes'),
    '/events': () => import('./api/events'),
    '/events/:id': () => import('./api/event'),
    '/lists/:id': () => import('./api/list'),
    '/lists/:id/items': () => import('./api/items'),
    '/lists/:id/items/:itemId': () => import('./api/item'),
    '/lists/:id/items/:itemId/photo': () => import('./api/photo'),
    '/lists/:id/items/:itemId/price': () => import('./api/item-price'),
    '/lists/:id/stores': () => import('./api/stores'),
    '/lists/:id/stores/:storeId': () => import('./api/store'),
    '/lists/:id/clear-done': () => import('./api/clear-done'),
    '/lists/:id/invite': () => import('./api/invite'),
    '/lists/:id/members': () => import('./api/members'),
    '/lists/:id/members/:userId': () => import('./api/member'),
  },
  platform: () => import('./platform'),
});

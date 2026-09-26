import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'utilities',
    name: 'Utility bill manager',
    version: '0.1.0',
    description:
      'Shared utility bills: upload the provider’s PDF, send meter readings with a photo, split the bill by consumption or equally, record who paid what with carry-over, and follow consumption, payments and prices in a calendar and statistics.',
    status: 'active',
    // Own MySQL database from UTILITIES_DB_* (ADR 0007).
    database: true,
    // Open to everyone and listed in the app's sitemap (ADR 0009).
    publicPages: [{ path: '/help', title: 'User manual' }],
  },
  layout: () => import('./layout'),
  pages: {
    '/': () => import('./pages/home'),
    '/profile': () => import('./pages/profile'),
    '/join/:code': () => import('./pages/join'),
    '/utilities/:id': () => import('./pages/utility'),
    '/utilities/:id/share': () => import('./pages/share'),
    '/utilities/:id/bills/new': () => import('./pages/bill-new'),
    '/bills/:id': () => import('./pages/bill'),
    '/bills/:id/edit': () => import('./pages/bill-edit'),
    '/help': () => import('./pages/help'),
  },
  api: {
    '/health': () => import('./api/health'),
    '/profile': () => import('./api/profile'),
    '/join': () => import('./api/join'),
    '/utilities': () => import('./api/utilities'),
    '/utilities/:id': () => import('./api/utility'),
    '/utilities/:id/bills': () => import('./api/bills'),
    '/utilities/:id/read-pdf': () => import('./api/read-pdf'),
    '/utilities/:id/invite': () => import('./api/invite'),
    '/utilities/:id/members': () => import('./api/members'),
    '/utilities/:id/members/:userId': () => import('./api/member'),
    '/bills/:id': () => import('./api/bill'),
    '/bills/:id/file': () => import('./api/bill-file'),
    '/bills/:id/provider-paid': () => import('./api/provider-paid'),
    '/bills/:id/readings/:userId': () => import('./api/reading'),
    '/bills/:id/readings/:userId/photo': () => import('./api/reading-photo'),
    '/bills/:id/payments/:userId': () => import('./api/payment'),
    '/bills/:id/comments': () => import('./api/comments'),
    '/bills/:id/comments/:commentId': () => import('./api/comment'),
  },
  platform: () => import('./platform'),
});

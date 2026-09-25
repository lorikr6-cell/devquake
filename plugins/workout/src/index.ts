import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'workout',
    name: 'Workout tracker',
    version: '0.6.0',
    description:
      'Workout routines made for you or built by you (gym, home or outside), a weekly plan, a guided workout with a voice coach on your phone, a calendar of your results and progress photos.',
    status: 'active',
    // Own MySQL database from WORKOUT_DB_* (ADR 0007).
    database: true,
    // Open to everyone and listed in the app's sitemap (ADR 0009).
    publicPages: [{ path: '/help', title: 'User manual' }],
  },
  layout: () => import('./layout'),
  pages: {
    '/': () => import('./pages/home'),
    '/setup': () => import('./pages/setup'),
    '/profile': () => import('./pages/profile'),
    '/routines/new': () => import('./pages/routine-edit'),
    '/routines/:id': () => import('./pages/routine'),
    '/routines/:id/edit': () => import('./pages/routine-edit'),
    '/plan': () => import('./pages/plan'),
    '/workout/:id': () => import('./pages/workout'),
    '/history': () => import('./pages/history'),
    '/history/:id': () => import('./pages/summary'),
    '/progress': () => import('./pages/progress'),
    '/help': () => import('./pages/help'),
  },
  api: {
    '/health': () => import('./api/health'),
    '/profile': () => import('./api/profile'),
    '/sessions': () => import('./api/sessions'),
    '/sessions/:id': () => import('./api/session'),
    '/sessions/:id/ops': () => import('./api/session-ops'),
    '/sessions/:id/keepalive': () => import('./api/session-keepalive'),
    '/routines': () => import('./api/routines'),
    '/routines/:id': () => import('./api/routine'),
    '/plan': () => import('./api/plan'),
    '/plan/:id': () => import('./api/plan-entry'),
    '/photos': () => import('./api/photos'),
    '/photos/:id': () => import('./api/photo'),
    '/photos/:kind/:period': () => import('./api/photo-upload'),
  },
  platform: () => import('./platform'),
});

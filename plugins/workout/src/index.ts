import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'workout',
    name: 'Workout tracker',
    version: '0.1.1',
    description:
      'Log workouts set by set, follow your progress, and compete on leaderboards per exercise.',
    status: 'active',
    // Own MySQL database from WORKOUT_DB_* (ADR 0007).
    database: true,
  },
  layout: () => import('./layout'),
  pages: {
    '/': () => import('./pages/home'),
  },
  api: {
    '/health': () => import('./api/health'),
  },
  platform: () => import('./platform'),
});

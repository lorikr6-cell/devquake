import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'workout',
    name: 'Workout tracker',
    version: '0.1.0',
    description:
      'Log workouts set by set, follow your progress, and compete on leaderboards per exercise.',
    status: 'active',
  },
  layout: () => import('./layout'),
  pages: {
    '/': () => import('./pages/home'),
  },
  api: {
    '/health': () => import('./api/health'),
  },
});

import type { HandProp, Metric, Pattern } from '../lib/catalog';
import { MOTIONS } from './motions';

/**
 * Illustrations for exercises and equipment that have none of their own (ADR 0015): a new
 * exercise gets the animation of its movement pattern (a press on a bench, a row, a squat...)
 * and the hand prop of its equipment, and new equipment gets a generated badge icon. So adding
 * a workout mode never leaves it without a picture.
 */

interface MotionInput {
  pattern: Pattern | string;
  role?: string;
  metric: Metric;
  equipment: readonly string[];
}

const BY_PATTERN: Record<string, string> = {
  warmup: 'march',
  squat: 'squat',
  hinge: 'hinge',
  lunge: 'lunge',
  glute: 'bridge',
  quads: 'leg_extension',
  hamstrings: 'leg_curl',
  calves: 'calf_raise',
  push_h: 'push_up',
  push_v: 'overhead_press',
  chest: 'fly',
  pull_h: 'row',
  pull_v: 'pull_up',
  back: 'superman',
  shoulders: 'lateral_raise',
  biceps: 'curl',
  triceps: 'overhead_triceps',
  core: 'crunch',
  conditioning: 'burpee',
  cardio: 'walk',
};

/** The animation that fits an exercise without one of its own. */
export function autoMotion(e: MotionInput): string {
  const has = (q: string) => e.equipment.includes(q);
  if (e.pattern === 'cardio') {
    if (has('exercise_bike')) return 'cycle';
    if (has('rowing_machine')) return 'rowing';
    if (has('jump_rope')) return 'jump_rope';
    return e.metric === 'distance' || has('treadmill') ? 'run' : 'walk';
  }
  if (e.pattern === 'push_h') {
    if (has('chest_press_machine')) return 'seated_press';
    if (has('bench')) return 'bench_press';
    if (has('resistance_bands') || has('cable_machine')) return 'press_forward';
  }
  if (e.pattern === 'pull_h' && (has('cable_machine') || has('resistance_bands')))
    return 'seated_row';
  if (e.pattern === 'pull_v' && has('cable_machine')) return 'lat_pulldown';
  if (e.pattern === 'squat') {
    if (has('leg_press')) return 'leg_press';
    if (has('barbell')) return 'back_squat';
    if (has('dumbbells') || has('kettlebell')) return 'goblet_squat';
  }
  if (e.pattern === 'lunge' && has('box')) return 'step_up';
  if (e.pattern === 'triceps' && has('cable_machine')) return 'pushdown';
  if (e.pattern === 'core' && e.metric === 'time') return 'plank';
  if (e.role === 'warmup') return 'march';
  return BY_PATTERN[e.pattern] ?? 'march';
}

/** What the figure holds, from the equipment. */
export function autoProp(equipment: readonly string[]): HandProp | null {
  if (equipment.includes('barbell')) return 'barbell';
  if (equipment.includes('kettlebell')) return 'kettlebell';
  if (equipment.includes('dumbbells')) return 'dumbbell';
  return null;
}

/** The exercise's own animation when it exists, otherwise the automatic one. */
export function motionFor(e: MotionInput & { motion?: string | null }): string {
  return e.motion && MOTIONS[e.motion] ? e.motion : autoMotion(e);
}

/**
 * A 24 × 24 badge icon for equipment without a drawn one: a rounded frame with the initials of
 * its slug ("foam_roller" → "FR"). Letters only, so it is safe to render as markup.
 */
export function generatedIcon(slug: string): string {
  const initials =
    slug
      .split(/[_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('')
      .replace(/[^A-Z0-9]/g, '') || '?';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="4"/><text x="12" y="15.5" text-anchor="middle" font-family="system-ui,sans-serif" font-size="8" font-weight="700" fill="currentColor" stroke="none">${initials}</text></svg>`;
}

import { exerciseName } from './format';
import type { Translate } from '@devquake/ui';
import type { Improvement } from '../lib/progress';
import { displayDistance, displayWeight } from '../lib/units';
import { clock } from '../lib/workout-state';

// Feedback after workouts (ADR 0015): an encouraging line and what got better.

/** An encouraging line, highlighted. */
export function Feedback({ text }: { text: string }) {
  return (
    <p className="rounded-xl border-l-4 border-quake bg-quake/5 px-4 py-3 font-medium dark:bg-quake/10">
      {text}
    </p>
  );
}

/** "Push-up: 12 reps → 14 reps", with a badge for a personal record. */
export function ImprovementList({
  items,
  t,
  unit,
  weightUnit,
  number,
}: {
  items: Improvement[];
  t: Translate;
  unit: 'km' | 'mi';
  weightUnit: 'kg' | 'lb';
  number: Intl.NumberFormat;
}) {
  if (!items.length) return null;
  const value = (i: Improvement, v: number) =>
    i.measure === 'weight'
      ? `${number.format(displayWeight(v, weightUnit, weightUnit === 'kg' ? 0.25 : 0.5))} ${weightUnit}`
      : i.measure === 'distance'
        ? `${number.format(displayDistance(v, unit))} ${unit}`
        : i.measure === 'seconds'
          ? clock(v)
          : t('summary.reps', { count: v });
  return (
    <ul className="mt-2 space-y-1 text-sm">
      {items.map((i) => (
        <li key={i.slug} className="flex flex-wrap items-center gap-2">
          <span aria-hidden className="text-quake">
            ▲
          </span>
          <span>
            {t('calendar.improved', {
              name: exerciseName(t, i),
              before: value(i, i.before),
              after: value(i, i.after),
            })}
          </span>
          {i.record ? (
            <span className="rounded-full bg-quake px-2 py-0.5 text-xs font-semibold text-white">
              {t('calendar.record')}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

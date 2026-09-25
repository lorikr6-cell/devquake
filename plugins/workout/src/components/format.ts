import type { Translate } from '@devquake/ui';
import type { PlannedItem } from '../lib/model';
import { displayDistance, type DistanceUnit } from '../lib/units';

/** A routine's name: generated ones are named by their template (translated). */
export function routineName(
  t: Translate,
  r: { template: string | null; name?: string | null; routineName?: string | null },
): string {
  const name = r.name ?? r.routineName;
  return name ?? (r.template ? t(`templates.${r.template}`) : t('templates.custom'));
}

/** "3 × 8–12 reps", "3 × 40 s" or "3.5 km" for a planned exercise. */
export function prescription(
  t: Translate,
  item: PlannedItem,
  unit: DistanceUnit,
  number: Intl.NumberFormat,
): string {
  if (item.distanceM !== null) {
    return t('routine.distance', {
      distance: number.format(displayDistance(item.distanceM, unit)),
      unit,
    });
  }
  if (item.seconds !== null) {
    return item.seconds >= 120
      ? t('routine.minutes', { sets: item.sets, minutes: Math.round(item.seconds / 60) })
      : t('routine.seconds', { sets: item.sets, seconds: item.seconds });
  }
  if (item.repsMin !== null && item.repsMax !== null && item.repsMin !== item.repsMax) {
    return t('routine.repsRange', { sets: item.sets, min: item.repsMin, max: item.repsMax });
  }
  return t('routine.repsFixed', { sets: item.sets, reps: item.targetReps ?? item.repsMin ?? 0 });
}

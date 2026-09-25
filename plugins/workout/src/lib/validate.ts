import { EQUIPMENT_SLUGS, LOCATIONS, type Location } from './catalog';
import { HttpError } from './http';
import { EXPERIENCES, GOALS, type Profile, type SessionOp } from './model';

/**
 * Input validation for the API. Every function throws HttpError(400) with a translation key;
 * `field` arguments are keys of fields.<field> in the translations.
 */

export type Body = Record<string, unknown>;

export async function readBody(request: Request): Promise<Body> {
  const data: unknown = await request.json().catch(() => null);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new HttpError(400, 'invalidRequest');
  }
  return data as Body;
}

const bad = (key: string, params?: Record<string, string | number>) =>
  new HttpError(400, key, params);

/** A number in [min, max], rounded to `decimals`. Accepts "72,5". */
export function numberIn(
  value: unknown,
  field: string,
  min: number,
  max: number,
  decimals = 0,
): number {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value.trim().replace(',', '.'))
        : NaN;
  if (!Number.isFinite(n) || n < min || n > max) throw bad('range', { field, min, max });
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/** Like numberIn, but null/undefined/"" = not entered. */
export function optionalNumber(
  value: unknown,
  field: string,
  min: number,
  max: number,
  decimals = 0,
): number | null {
  if (value === undefined || value === null || value === '') return null;
  return numberIn(value, field, min, max, decimals);
}

export function choice<T extends string>(value: unknown, options: readonly T[], field: string): T {
  if (typeof value === 'string' && (options as readonly string[]).includes(value))
    return value as T;
  throw bad('choice', { field });
}

/** A positive integer id, e.g. from a route param. */
export function id(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isSafeInteger(n) || n <= 0) throw new HttpError(404, 'notFound');
  return n;
}

export interface ProfileInput {
  profile: Profile;
  locations: Location[];
  equipment: string[];
  regenerate: boolean;
  monthlyEmail: boolean;
}

/** PUT /api/profile. Values arrive in kg and cm (the form converts lb and ft). */
export function profileInput(body: Body, year: number): ProfileInput {
  const locations = Array.isArray(body.locations)
    ? [...new Set(body.locations.map((l) => choice(l, LOCATIONS, 'location')))]
    : [];
  if (locations.length === 0) throw bad('noPlaces');
  const equipment = Array.isArray(body.equipment)
    ? [...new Set(body.equipment.map((e) => choice(e, EQUIPMENT_SLUGS, 'equipment')))]
    : [];
  return {
    profile: {
      birthYear: numberIn(body.birthYear, 'birthYear', year - 100, year - 13),
      heightCm: numberIn(body.heightCm, 'height', 100, 250, 1),
      weightKg: numberIn(body.weightKg, 'weight', 30, 300, 2),
      weightUnit: choice(body.weightUnit, ['kg', 'lb'] as const, 'weight'),
      heightUnit: choice(body.heightUnit, ['cm', 'ft'] as const, 'height'),
      experience: choice(body.experience, EXPERIENCES, 'experience'),
      goal: choice(body.goal, GOALS, 'goal'),
      daysPerWeek: numberIn(body.daysPerWeek, 'daysPerWeek', 1, 7),
      sessionMinutes: numberIn(body.sessionMinutes, 'sessionMinutes', 15, 180),
      lowImpact: body.lowImpact === true,
    },
    locations: LOCATIONS.filter((l) => locations.includes(l)),
    equipment,
    regenerate: body.regenerate === true,
    monthlyEmail: body.monthlyEmail !== false,
  };
}

const MAX_OPS = 200;

/** POST /api/sessions/:id/ops { ops: SessionOp[] }. */
export function sessionOps(body: Body): SessionOp[] {
  if (!Array.isArray(body.ops) || body.ops.length > MAX_OPS) throw bad('invalidRequest');
  return body.ops.map((raw): SessionOp => {
    if (!raw || typeof raw !== 'object') throw bad('invalidRequest');
    const op = raw as Body;
    const at = numberIn(op.at, 'time', 0, Number.MAX_SAFE_INTEGER);
    if (op.type === 'finish') return { type: 'finish', at };
    const itemId = id(op.itemId);
    if (op.type === 'next') return { type: 'next', itemId, at };
    if (op.type !== 'set') throw bad('invalidRequest');
    return {
      type: 'set',
      itemId,
      setNo: numberIn(op.setNo, 'set', 1, 50),
      reps: optionalNumber(op.reps, 'reps', 0, 9999),
      seconds: optionalNumber(op.seconds, 'seconds', 0, 86_400),
      distanceM: optionalNumber(op.distanceM, 'distance', 0, 1_000_000),
      weightKg: optionalNumber(op.weightKg, 'weight', 0, 999, 2),
      done: op.done === true,
      at,
    };
  });
}

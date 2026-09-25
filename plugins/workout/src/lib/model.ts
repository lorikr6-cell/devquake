import type { Location, Metric } from './catalog';
import type { HeightUnit, WeightUnit } from './units';

/** Shared types of the server and the pages (ADR 0013). */

export const EXPERIENCES = ['beginner', 'intermediate', 'advanced'] as const;
export type Experience = (typeof EXPERIENCES)[number];

export const GOALS = ['strength', 'muscle', 'endurance', 'general', 'weight_loss'] as const;
export type Goal = (typeof GOALS)[number];

export const SESSION_MINUTES = [20, 30, 45, 60, 75, 90] as const;

export interface Profile {
  birthYear: number;
  heightCm: number;
  weightKg: number;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  experience: Experience;
  goal: Goal;
  daysPerWeek: number;
  sessionMinutes: number;
  lowImpact: boolean;
}

export type Phase = 'warmup' | 'main';

/** One exercise of a routine as planned; the fields that do not fit its metric are null. */
export interface PlannedItem {
  slug: string;
  phase: Phase;
  sets: number;
  repsMin: number | null;
  repsMax: number | null;
  targetReps: number | null;
  seconds: number | null;
  distanceM: number | null;
  restSeconds: number;
}

export interface PlannedRoutine {
  location: Location;
  template: string;
  items: PlannedItem[];
}

/** What the generator and the estimates need to know about an exercise. */
export interface ExerciseInfo {
  slug: string;
  role: 'warmup' | 'strength' | 'core' | 'cardio';
  pattern: string;
  metric: Metric;
  equipment: readonly string[];
  places: readonly Location[];
  difficulty: number;
  lowImpact: boolean;
  weighted: boolean;
  secondsPerRep: number;
  speed: number;
  met: number;
}

/** One set as recorded; null = not entered. */
export interface SetResult {
  setNo: number;
  reps: number | null;
  seconds: number | null;
  distanceM: number | null;
  weightKg: number | null;
  /** ISO time the set was marked done; null while it is still open. */
  doneAt: string | null;
}

export interface SessionItemView {
  id: number;
  position: number;
  phase: Phase;
  slug: string;
  metric: Metric;
  weighted: boolean;
  equipment: string[];
  sets: number;
  repsMin: number | null;
  repsMax: number | null;
  targetReps: number | null;
  targetSeconds: number | null;
  targetDistanceM: number | null;
  targetWeightKg: number | null;
  restSeconds: number;
  startedAt: string | null;
  endedAt: string | null;
  results: SetResult[];
}

export type SessionStatus = 'active' | 'finished';

/** A workout as the workout screen and the summary see it. Times are ISO strings (UTC). */
export interface SessionView {
  id: number;
  status: SessionStatus;
  routineName: string | null;
  template: string | null;
  location: Location;
  startedAt: string;
  finishedAt: string | null;
  kcal: number | null;
  bodyWeightKg: number;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  /** The server's clock when this was read, to line the phone's clock up with it. */
  now: string;
  items: SessionItemView[];
}

/** Changes the workout screen sends (POST /api/sessions/:id/ops); all of them can be repeated. */
export type SessionOp =
  | {
      type: 'set';
      itemId: number;
      setNo: number;
      reps?: number | null;
      seconds?: number | null;
      distanceM?: number | null;
      weightKg?: number | null;
      done: boolean;
      /** Epoch ms on the server's clock (the phone corrects its own). */
      at: number;
    }
  | { type: 'next'; itemId: number; at: number }
  | { type: 'finish'; at: number };

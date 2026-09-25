import { describe, expect, it } from 'vitest';
import { exerciseInput } from './exercise-input';
import type { HttpError } from './http';

const valid = {
  name: '  Wall   sit ',
  role: 'strength',
  pattern: 'squat',
  metric: 'time',
  places: ['home', 'gym'],
  equipment: [],
  muscles: ['quads', 'glutes'],
  difficulty: 2,
  weighted: true,
  lowImpact: true,
};

const errorKey = (fn: () => unknown) => {
  try {
    fn();
  } catch (err) {
    return (err as HttpError).key;
  }
  return null;
};

describe('exerciseInput', () => {
  it('cleans the input and derives the estimates', () => {
    const e = exerciseInput(valid);
    expect(e.name).toBe('Wall sit');
    expect(e.places).toEqual(['home', 'gym']);
    // Only repetition exercises can be done with added weight.
    expect(e.weighted).toBe(false);
    expect(e.met).toBe(5);
    expect(e.howTo).toBeNull();
  });

  it('fixes the movement for kinds that have one', () => {
    expect(exerciseInput({ ...valid, role: 'core', pattern: 'squat' }).pattern).toBe('core');
    expect(
      exerciseInput({ ...valid, role: 'cardio', pattern: 'cardio', metric: 'distance' }).speed,
    ).toBe(1.4);
  });

  it('rejects unknown values', () => {
    expect(errorKey(() => exerciseInput({ ...valid, name: 'x' }))).toBe('exerciseName');
    expect(errorKey(() => exerciseInput({ ...valid, pattern: 'fly' }))).toBe('choice');
    expect(errorKey(() => exerciseInput({ ...valid, places: [] }))).toBe('noPlaces');
    expect(errorKey(() => exerciseInput({ ...valid, equipment: ['rocket'] }))).toBe('choice');
    expect(errorKey(() => exerciseInput({ ...valid, difficulty: 5 }))).toBe('range');
  });
});

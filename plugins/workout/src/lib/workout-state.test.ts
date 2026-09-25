import { describe, expect, it } from 'vitest';
import { clampTime } from './data';
import type { SessionItemView, SessionView } from './model';
import { applyOps, clock, currentItem, currentSetNo, draftFor, enqueue } from './workout-state';

const item = (id: number, p: Partial<SessionItemView> = {}): SessionItemView => ({
  id,
  position: id,
  phase: 'main',
  slug: 'push_up',
  name: null,
  howTo: null,
  motion: 'push_up',
  prop: null,
  metric: 'reps',
  weighted: false,
  equipment: [],
  sets: 2,
  repsMin: 8,
  repsMax: 12,
  targetReps: 10,
  targetSeconds: null,
  targetDistanceM: null,
  targetWeightKg: null,
  restSeconds: 60,
  startedAt: null,
  endedAt: null,
  results: [],
  ...p,
});

const T0 = Date.UTC(2026, 8, 25, 10, 0, 0);
const view: SessionView = {
  id: 1,
  status: 'active',
  routineName: null,
  template: 'full_body',
  location: 'gym',
  startedAt: new Date(T0).toISOString(),
  finishedAt: null,
  kcal: null,
  bodyWeightKg: 80,
  weightUnit: 'kg',
  heightUnit: 'cm',
  now: new Date(T0).toISOString(),
  items: [
    item(1, { startedAt: new Date(T0).toISOString() }),
    item(2, { weighted: true, targetWeightKg: 20 }),
  ],
};

describe('workout state', () => {
  it('moves through sets, then to the next exercise, then finishes', () => {
    let v = applyOps(view, [
      { type: 'set', itemId: 1, setNo: 1, reps: 10, done: true, at: T0 + 30_000 },
    ]);
    expect(currentItem(v)?.id).toBe(1);
    expect(currentSetNo(currentItem(v)!)).toBe(2);

    v = applyOps(v, [
      { type: 'set', itemId: 1, setNo: 2, reps: 9, done: true, at: T0 + 120_000 },
      { type: 'next', itemId: 1, at: T0 + 121_000 },
    ]);
    expect(currentItem(v)?.id).toBe(2);
    expect(v.items[0]!.endedAt).toBe(new Date(T0 + 121_000).toISOString());
    expect(v.items[1]!.startedAt).toBe(new Date(T0 + 121_000).toISOString());

    v = applyOps(v, [{ type: 'next', itemId: 2, at: T0 + 300_000 }]);
    expect(v.status).toBe('finished');
    expect(currentItem(v)).toBeNull();
  });

  it('ignores a repeated "next" for an exercise that already ended', () => {
    const once = applyOps(view, [{ type: 'next', itemId: 1, at: T0 + 1000 }]);
    const twice = applyOps(once, [{ type: 'next', itemId: 1, at: T0 + 5000 }]);
    expect(twice).toEqual(once);
  });

  it('keeps the first "done" time when a set is changed afterwards', () => {
    const v = applyOps(view, [
      { type: 'set', itemId: 1, setNo: 1, reps: 10, done: true, at: T0 + 1000 },
      { type: 'set', itemId: 1, setNo: 1, reps: 11, done: false, at: T0 + 9000 },
    ]);
    expect(v.items[0]!.results[0]).toMatchObject({
      reps: 11,
      doneAt: new Date(T0 + 1000).toISOString(),
    });
  });

  it('prefills a set from the suggestion and carries the weight over', () => {
    expect(draftFor(view.items[0]!, 1)).toEqual({
      reps: 10,
      seconds: null,
      distanceM: null,
      weightKg: null,
    });
    expect(draftFor(view.items[1]!, 1).weightKg).toBe(20);
    const v = applyOps(view, [
      { type: 'set', itemId: 2, setNo: 1, reps: 10, weightKg: 22.5, done: true, at: T0 },
    ]);
    expect(draftFor(v.items[1]!, 2).weightKg).toBe(22.5);
  });

  it('keeps only the newest autosave of a set in the queue', () => {
    let q = enqueue([], { type: 'set', itemId: 1, setNo: 1, reps: 9, done: false, at: 1 });
    q = enqueue(q, { type: 'set', itemId: 1, setNo: 1, reps: 10, done: false, at: 2 });
    expect(q).toHaveLength(1);
    q = enqueue(q, { type: 'set', itemId: 1, setNo: 1, reps: 10, done: true, at: 3 });
    q = enqueue(q, { type: 'set', itemId: 1, setNo: 1, reps: 11, done: false, at: 4 });
    expect(q.map((o) => o.at)).toEqual([3, 4]);
  });

  it('formats a clock', () => {
    expect(clock(65)).toBe('1:05');
    expect(clock(3723)).toBe('1:02:03');
  });
});

describe('clampTime', () => {
  const now = new Date(T0 + 60_000);
  it("uses the phone's time when it lies between the start and now", () => {
    expect(clampTime(T0 + 30_000, new Date(T0), now).getTime()).toBe(T0 + 30_000);
  });
  it('never goes into the future or before the start', () => {
    expect(clampTime(T0 + 999_999, new Date(T0), now)).toBe(now);
    expect(clampTime(T0 - 5000, new Date(T0), now).getTime()).toBe(T0);
  });
});

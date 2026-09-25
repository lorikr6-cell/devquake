import type { SessionItemView, SessionOp, SessionView, SetResult } from './model';

/**
 * The workout screen's state (ADR 0013): the server's view with the phone's own changes applied
 * on top, so the screen never waits for the network. The same changes go to the server in order
 * (POST /api/sessions/:id/ops), and wait in a queue on the phone while there is no connection.
 */

const iso = (at: number) => new Date(at).toISOString();

function applySet(item: SessionItemView, op: Extract<SessionOp, { type: 'set' }>): SessionItemView {
  const existing = item.results.find((r) => r.setNo === op.setNo);
  const result: SetResult = {
    setNo: op.setNo,
    reps: op.reps ?? null,
    seconds: op.seconds ?? null,
    distanceM: op.distanceM ?? null,
    weightKg: op.weightKg ?? null,
    doneAt: existing?.doneAt ?? (op.done ? iso(op.at) : null),
  };
  const results = [...item.results.filter((r) => r.setNo !== op.setNo), result].sort(
    (a, b) => a.setNo - b.setNo,
  );
  return { ...item, results };
}

function finishView(view: SessionView, at: number): SessionView {
  return {
    ...view,
    status: 'finished',
    finishedAt: iso(at),
    items: view.items.map((i) => (i.startedAt && !i.endedAt ? { ...i, endedAt: iso(at) } : i)),
  };
}

export function applyOp(view: SessionView, op: SessionOp): SessionView {
  if (view.status !== 'active') return view;
  if (op.type === 'finish') return finishView(view, op.at);
  const index = view.items.findIndex((i) => i.id === op.itemId);
  const item = view.items[index];
  if (!item) return view;
  if (op.type === 'set') {
    const items = [...view.items];
    items[index] = applySet(item, op);
    return { ...view, items };
  }
  if (item.endedAt) return view;
  const items = view.items.map((i, n) => {
    if (n === index) return { ...i, startedAt: i.startedAt ?? iso(op.at), endedAt: iso(op.at) };
    if (n === index + 1 && !i.startedAt) return { ...i, startedAt: iso(op.at) };
    return i;
  });
  const next = { ...view, items };
  return index === view.items.length - 1 ? finishView(next, op.at) : next;
}

export function applyOps(view: SessionView, ops: readonly SessionOp[]): SessionView {
  return ops.reduce(applyOp, view);
}

/** The exercise being done: the first that has not ended (null when the workout is over). */
export function currentItem(view: SessionView): SessionItemView | null {
  if (view.status !== 'active') return null;
  return view.items.find((i) => !i.endedAt) ?? null;
}

/** The set being done (1-based): the first that is not marked done. */
export function currentSetNo(item: SessionItemView): number {
  for (let n = 1; n <= item.sets; n++) {
    if (!item.results.find((r) => r.setNo === n)?.doneAt) return n;
  }
  return item.sets + 1;
}

/**
 * Adds a change to the queue. A set saved while typing is replaced by a newer save of the same
 * set, so a slow connection does not pile up requests.
 */
export function enqueue(queue: readonly SessionOp[], op: SessionOp): SessionOp[] {
  if (op.type !== 'set') return [...queue, op];
  const last = queue.at(-1);
  if (last?.type === 'set' && last.itemId === op.itemId && last.setNo === op.setNo && !last.done) {
    return [...queue.slice(0, -1), op];
  }
  return [...queue, op];
}

/** What the person enters for the current set, prefilled from the suggestion. */
export interface SetDraft {
  reps: number | null;
  seconds: number | null;
  distanceM: number | null;
  weightKg: number | null;
}

export function draftFor(item: SessionItemView, setNo: number): SetDraft {
  const saved = item.results.find((r) => r.setNo === setNo);
  if (saved)
    return {
      reps: saved.reps,
      seconds: saved.seconds,
      distanceM: saved.distanceM,
      weightKg: saved.weightKg,
    };
  // The weight carries over from the previous set of this exercise.
  const previous = [...item.results].reverse().find((r) => r.setNo < setNo && r.weightKg !== null);
  return {
    reps: item.metric === 'reps' ? item.targetReps : null,
    seconds: item.metric === 'time' ? item.targetSeconds : null,
    distanceM: item.metric === 'distance' ? item.targetDistanceM : null,
    weightKg: item.weighted ? (previous?.weightKg ?? item.targetWeightKg) : null,
  };
}

/** "4:05", "1:02:03". */
export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

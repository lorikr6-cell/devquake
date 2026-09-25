'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, cn, LOCALE_TAGS, useLocale, useT } from '@devquake/ui';
import { equipmentScenes } from '../illustrations/motions';
import { StickFigure } from '../illustrations/stick-figure';
import { exerciseDef } from '../lib/catalog';
import type { SessionItemView, SessionOp, SessionView } from '../lib/model';
import {
  displayDistance,
  displayWeight,
  distanceToM,
  distanceUnit,
  weightInputStep,
  weightToKg,
} from '../lib/units';
import {
  applyOp,
  applyOps,
  clock,
  currentItem,
  currentSetNo,
  draftFor,
  enqueue,
  type SetDraft,
} from '../lib/workout-state';
import { motivationKey } from '../lib/voice';
import { callApi } from './call-api';
import { useAppRouter } from './use-app-router';
import { useSpeaker, VoiceMenu } from './voice';

/** A typed value is saved after this long without a change or a focus change (ADR 0013). */
const AUTOSAVE_MS = 10_000;
const RETRY_MS = 15_000;
/** The workout screen tells the server it is still in use this often (ADR 0014). */
const KEEPALIVE_MS = 4 * 60_000;
/** The get-ready countdown before the first exercise and before a timed set. */
const FIRST_COUNTDOWN_MS = 5_000;
const COUNTDOWN_MS = 3_000;

type Sync = 'saved' | 'saving' | 'offline' | 'signedOut';

interface Rest {
  until: number;
  /** Shown under the countdown: the next set or the next exercise. */
  label: string;
}

function readQueue(key: string): SessionOp[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SessionOp[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(key: string, queue: SessionOp[]) {
  try {
    if (queue.length) localStorage.setItem(key, JSON.stringify(queue));
    else localStorage.removeItem(key);
  } catch {
    // Storage full or blocked: the queue still lives in memory for this page.
  }
}

function vibrate(ms: number | number[]) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // not supported
  }
}

/** Keeps the screen on while the workout runs, where the browser allows it. */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let stopped = false;
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
        if (stopped) void lock.release();
      } catch {
        // denied (battery saver, not visible): the workout still works
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void request();
    };
    void request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release().catch(() => undefined);
    };
  }, [active]);
}

function Stepper({
  value,
  onChange,
  step,
  label,
  decimals = 0,
  onFocusChange,
  big = false,
  lessLabel,
  moreLabel,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  step: number;
  label: string;
  decimals?: number;
  onFocusChange: () => void;
  big?: boolean;
  lessLabel: string;
  moreLabel: string;
}) {
  const [text, setText] = useState(value === null ? '' : String(value));
  useEffect(() => {
    setText((current) =>
      Number(current.replace(',', '.')) === value ? current : value === null ? '' : String(value),
    );
  }, [value]);
  const round = (n: number) => Math.round(n * 10 ** decimals) / 10 ** decimals;
  const bump = (delta: number) => onChange(round(Math.max(0, (value ?? 0) + delta)));
  const button =
    'flex shrink-0 items-center justify-center rounded-xl border border-ink/15 text-3xl font-bold active:bg-ink/10 dark:border-paper/20 dark:active:bg-paper/15';
  return (
    <div className="flex items-stretch gap-2">
      <button
        type="button"
        aria-label={lessLabel}
        className={cn(button, big ? 'size-16' : 'size-12')}
        onClick={() => bump(-step)}
      >
        −
      </button>
      <input
        aria-label={label}
        inputMode={decimals ? 'decimal' : 'numeric'}
        className={cn(
          'min-w-0 flex-1 rounded-xl border border-ink/15 bg-white text-center font-bold tabular-nums focus:border-quake focus:outline-none focus:ring-2 focus:ring-quake/30 dark:border-paper/20 dark:bg-ink',
          big ? 'h-16 text-4xl' : 'h-12 text-2xl',
        )}
        value={text}
        onFocus={onFocusChange}
        onBlur={onFocusChange}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.,]/g, '');
          setText(raw);
          const n = Number(raw.replace(',', '.'));
          onChange(raw === '' || !Number.isFinite(n) ? null : round(n));
        }}
      />
      <button
        type="button"
        aria-label={moreLabel}
        className={cn(button, big ? 'size-16' : 'size-12')}
        onClick={() => bump(step)}
      >
        +
      </button>
    </div>
  );
}

/**
 * The guided workout (ADR 0013), full screen and made for a phone: one exercise, one number,
 * one big button. Every change is applied here at once and sent to the server in order; while
 * there is no connection the changes wait in localStorage. A voice coach (ADR 0015) counts down,
 * announces sets, rests and the next exercise, and cheers the person on.
 */
export function WorkoutView({ initial, signInUrl }: { initial: SessionView; signInUrl: string }) {
  const t = useT('workout');
  const tAll = useT();
  const locale = useLocale();
  const router = useAppRouter();
  const storageKey = `dq-workout:${initial.id}`;
  const number = useMemo(
    () => new Intl.NumberFormat(LOCALE_TAGS[locale], { maximumFractionDigits: 2 }),
    [locale],
  );

  // The phone's clock lined up with the server's.
  const offset = useMemo(() => new Date(initial.now).getTime() - Date.now(), [initial.now]);
  const serverNow = useCallback(() => Date.now() + offset, [offset]);

  const queueRef = useRef<SessionOp[]>([]);
  const [view, setView] = useState<SessionView>(initial);
  const [sync, setSync] = useState<Sync>('saved');
  const inFlight = useRef(false);

  // Changes left on this phone by an earlier visit are applied and sent first.
  useEffect(() => {
    const stored = readQueue(storageKey);
    if (stored.length) {
      queueRef.current = stored;
      setView(applyOps(initial, stored));
    }
  }, [initial, storageKey]);

  const flush = useCallback(async () => {
    const ops = queueRef.current;
    if (!ops.length || inFlight.current) return;
    inFlight.current = true;
    setSync('saving');
    try {
      await callApi(`/sessions/${initial.id}/ops`, 'POST', { ops });
      queueRef.current = queueRef.current.slice(ops.length);
      writeQueue(storageKey, queueRef.current);
      setSync(queueRef.current.length ? 'saving' : 'saved');
    } catch (err) {
      const status = (err as { status?: number }).status ?? 0;
      if (status === 404) {
        // The workout was discarded elsewhere.
        queueRef.current = [];
        writeQueue(storageKey, []);
        router.push('/');
        return;
      }
      if (status === 401) {
        // The sign-in ended: keep everything on the phone until the person signs in again.
        setSync('signedOut');
      } else if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
        // The server will never accept these changes; drop them instead of retrying forever.
        queueRef.current = queueRef.current.slice(ops.length);
        writeQueue(storageKey, queueRef.current);
        setSync('saved');
      } else {
        setSync('offline');
      }
    } finally {
      inFlight.current = false;
    }
    if (queueRef.current.length) void flush();
  }, [initial.id, router, storageKey]);

  /** Sends what is waiting even when the page is closing. */
  const beacon = useCallback(() => {
    if (!queueRef.current.length || !('sendBeacon' in navigator)) return;
    const body = new Blob([JSON.stringify({ ops: queueRef.current })], {
      type: 'application/json',
    });
    navigator.sendBeacon(`/api/sessions/${initial.id}/ops`, body);
  }, [initial.id]);

  const push = useCallback(
    (op: SessionOp) => {
      setView((v) => applyOp(v, op));
      queueRef.current = enqueue(queueRef.current, op);
      writeQueue(storageKey, queueRef.current);
      void flush();
    },
    [flush, storageKey],
  );

  useEffect(() => {
    const retry = () => void flush();
    window.addEventListener('online', retry);
    const timer = window.setInterval(retry, RETRY_MS);
    void flush();
    return () => {
      window.removeEventListener('online', retry);
      window.clearInterval(timer);
    };
  }, [flush]);

  // Keep the sign-in alive while the workout runs (ADR 0014).
  useEffect(() => {
    if (view.status !== 'active') return;
    const ping = async () => {
      if (document.visibilityState !== 'visible') return;
      const res = await fetch(`/api/sessions/${initial.id}/keepalive`, { method: 'POST' }).catch(
        () => null,
      );
      if (res?.status === 401) setSync('signedOut');
      else if (res?.ok) setSync((s) => (s === 'signedOut' ? 'saved' : s));
    };
    void ping();
    const id = window.setInterval(() => void ping(), KEEPALIVE_MS);
    return () => window.clearInterval(id);
  }, [initial.id, view.status]);

  // --- The current exercise and set ------------------------------------------------------------

  const item = currentItem(view);
  const setNo = item ? currentSetNo(item) : 0;
  const itemIndex = item ? view.items.findIndex((i) => i.id === item.id) : view.items.length;
  const def = item ? exerciseDef(item.slug) : undefined;
  const nextItem = item ? view.items[itemIndex + 1] : undefined;
  const unit = distanceUnit(view.heightUnit);
  const name = (i: SessionItemView) => tAll(`exercises.${i.slug}.name`);

  const [draft, setDraft] = useState<SetDraft>(() =>
    item ? draftFor(item, setNo) : { reps: null, seconds: null, distanceM: null, weightKg: null },
  );
  const dirty = useRef(false);
  const [touch, setTouch] = useState(0);
  const setKey = item ? `${item.id}:${setNo}` : 'done';
  const [rest, setRest] = useState<Rest | null>(null);
  const [showHowTo, setShowHowTo] = useState(false);
  const [menu, setMenu] = useState(false);
  const { say, style } = useSpeaker();
  const v = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      tAll(`voice.${style}.${key}`, params),
    [style, tAll],
  );
  /** A get-ready countdown; `timer`: start the set's timer when it ends. */
  const [countdown, setCountdown] = useState<{ until: number; timer: boolean } | null>(null);
  const spoken = useRef('');
  const detail = (i: SessionItemView) =>
    i.metric === 'reps'
      ? t('detail.reps', { sets: i.sets, reps: i.targetReps ?? 0 })
      : i.metric === 'time'
        ? t('detail.seconds', { sets: i.sets, seconds: i.targetSeconds ?? 0 })
        : t('detail.distance', {
            distance: number.format(
              displayDistance(i.targetDistanceM ?? 0, distanceUnit(view.heightUnit)),
            ),
            unit: distanceUnit(view.heightUnit),
          });
  const setsDone = view.items.reduce((n, i) => n + i.results.filter((r) => r.doneAt).length, 0);

  // Timer for timed sets and stopwatch for distances: ms counted before the last start.
  const [timer, setTimer] = useState<{ running: boolean; since: number; before: number }>({
    running: false,
    since: 0,
    before: 0,
  });
  const [, setTick] = useState(0);

  useEffect(() => {
    if (item) setDraft(draftFor(item, setNo));
    dirty.current = false;
    setTimer({ running: false, since: 0, before: 0 });
    setShowHowTo(false);
    spoken.current = '';
    if (!item) return;
    // The very first set of the workout: introduce it and count down.
    if (itemIndex === 0 && setNo === 1 && setsDone === 0) {
      say(v('start', { name: name(item), detail: detail(item) }), true);
      setCountdown({ until: Date.now() + FIRST_COUNTDOWN_MS, timer: false });
    } else if (setNo === item.sets && item.sets > 1) {
      say(v('lastSet'));
    }
  }, [setKey]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 250);
    return () => window.clearInterval(id);
  }, []);

  const saveDraft = useCallback(
    (done: boolean, values: SetDraft = draft) => {
      if (!item) return;
      dirty.current = false;
      push({ type: 'set', itemId: item.id, setNo, ...values, done, at: serverNow() });
    },
    [draft, item, push, serverNow, setNo],
  );

  const change = (values: Partial<SetDraft>) => {
    dirty.current = true;
    setDraft((d) => ({ ...d, ...values }));
    setTouch((n) => n + 1);
  };

  // Autosave: 10 seconds after the last change or focus change.
  useEffect(() => {
    if (!dirty.current) return;
    const id = window.setTimeout(() => {
      if (dirty.current) saveDraft(false);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(id);
  }, [touch, saveDraft]);

  // Leaving the page or locking the phone: save now.
  useEffect(() => {
    const leave = () => {
      if (dirty.current) saveDraft(false);
      beacon();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') leave();
      else void flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', leave);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', leave);
    };
  }, [beacon, flush, saveDraft]);

  useWakeLock(view.status === 'active');

  const completeSet = (values: SetDraft) => {
    if (!item) return;
    saveDraft(true, values);
    vibrate(40);
    const lastSet = setNo >= item.sets;
    const beat =
      item.metric === 'reps' && item.targetReps !== null && (values.reps ?? 0) > item.targetReps;
    const cheer = beat ? v('beatTarget') : v('setDone');
    if (lastSet) {
      push({ type: 'next', itemId: item.id, at: serverNow() });
      if (!nextItem) return; // the workout is over; the summary says the rest
      if (item.restSeconds > 0) {
        setRest({
          until: Date.now() + item.restSeconds * 1000,
          label: t('upNext', { name: name(nextItem) }),
        });
        say(
          `${cheer} ${v('rest', { seconds: item.restSeconds })} ${v('next', { name: name(nextItem), detail: detail(nextItem) })}`,
          true,
        );
      } else {
        say(`${cheer} ${v('next', { name: name(nextItem), detail: detail(nextItem) })}`, true);
      }
    } else if (item.restSeconds > 0) {
      setRest({
        until: Date.now() + item.restSeconds * 1000,
        label: t('nextSet', { set: setNo + 1, sets: item.sets }),
      });
      say(`${cheer} ${v('rest', { seconds: item.restSeconds })}`, true);
    } else {
      say(cheer, true);
    }
  };

  const restLeft = rest ? Math.ceil((rest.until - Date.now()) / 1000) : 0;
  useEffect(() => {
    if (!rest) return;
    // The last three seconds of a rest are counted out loud, then "go".
    if (restLeft > 0 && restLeft <= 3 && spoken.current !== `rest${restLeft}`) {
      spoken.current = `rest${restLeft}`;
      say(String(restLeft), true);
    }
    if (restLeft <= 0) {
      vibrate([80, 60, 80]);
      say(v('go'), true);
      setRest(null);
    }
  }, [rest, restLeft, say, v]);

  const countdownLeft = countdown ? Math.ceil((countdown.until - Date.now()) / 1000) : 0;

  const elapsedMs = timer.before + (timer.running ? Date.now() - timer.since : 0);
  const startTimer = () => setTimer((s) => ({ ...s, running: true, since: Date.now() }));
  /** A timed set starts after a 3-2-1 countdown the first time; resuming starts at once. */
  const startTimedSet = () => {
    if (elapsedMs > 0) startTimer();
    else setCountdown({ until: Date.now() + COUNTDOWN_MS, timer: true });
  };

  useEffect(() => {
    if (!countdown) return;
    if (countdownLeft > 0 && countdownLeft <= 3 && spoken.current !== `cd${countdownLeft}`) {
      spoken.current = `cd${countdownLeft}`;
      say(String(countdownLeft), true);
    }
    if (countdownLeft <= 0) {
      say(v('go'), true);
      vibrate(60);
      if (countdown.timer) startTimer();
      setCountdown(null);
    }
  }, [countdown, countdownLeft, say, v]);
  const pauseTimer = () =>
    setTimer((s) => ({ running: false, since: 0, before: s.before + Date.now() - s.since }));

  // A timed set completes by itself when the countdown reaches zero; halfway and the last ten
  // seconds are announced.
  const target = item?.targetSeconds ?? 0;
  useEffect(() => {
    if (item?.metric !== 'time' || !timer.running || target < 30) return;
    const left = target - elapsedMs / 1000;
    if (left <= target / 2 && left > 11 && spoken.current !== 'half') {
      spoken.current = 'half';
      say(v('halfway'));
    } else if (left <= 10 && left > 0 && spoken.current !== 'ten') {
      spoken.current = 'ten';
      say(v('tenLeft'));
    }
  });
  useEffect(() => {
    if (item?.metric === 'time' && timer.running && elapsedMs >= target * 1000) {
      setTimer({ running: false, since: 0, before: 0 });
      completeSet({ ...draft, seconds: target });
    }
  });

  // Finished: cheer, send the rest and open the summary.
  const finished = view.status === 'finished';
  useEffect(() => {
    if (finished) say(v('workoutDone'), true);
  }, [finished]);
  useEffect(() => {
    if (view.status !== 'finished') return;
    if (sync === 'saved' && queueRef.current.length === 0) {
      writeQueue(storageKey, []);
      router.push(`/history/${view.id}`);
    }
  }, [router, storageKey, sync, view.id, view.status]);

  const finishNow = () => {
    setMenu(false);
    setRest(null);
    if (dirty.current) saveDraft(false);
    push({ type: 'finish', at: serverNow() });
  };

  const discard = async () => {
    setMenu(false);
    queueRef.current = [];
    writeQueue(storageKey, []);
    try {
      await callApi(`/sessions/${view.id}`, 'DELETE');
    } catch {
      // Already gone or offline: the dashboard offers to discard it again.
    }
    router.push('/');
  };

  // --- Render ----------------------------------------------------------------------------------

  const total = view.items.length;
  const totalSeconds = (serverNow() - new Date(view.startedAt).getTime()) / 1000;

  if (view.status === 'finished' || !item) {
    return (
      <div className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-paper p-6 text-center dark:bg-ink">
        <p className="font-display text-2xl font-bold">{t('finishing')}</p>
        {sync === 'signedOut' ? (
          <>
            <p className="max-w-sm text-sm text-ink/70 dark:text-paper/70">{t('signedOut')}</p>
            <a href={signInUrl} className="font-medium text-quake underline">
              {t('signIn')}
            </a>
          </>
        ) : null}
        {sync === 'offline' ? (
          <>
            <p className="max-w-sm text-sm text-ink/70 dark:text-paper/70">{t('offline')}</p>
            <Button type="button" onClick={() => void flush()} className="min-h-11">
              {t('retry')}
            </Button>
          </>
        ) : null}
      </div>
    );
  }

  const weightUnit = view.weightUnit;
  const weightShown =
    draft.weightKg === null
      ? null
      : displayWeight(draft.weightKg, weightUnit, weightUnit === 'kg' ? 0.25 : 0.5);
  const distanceShown = draft.distanceM === null ? null : displayDistance(draft.distanceM, unit);

  const suggestion =
    item.metric === 'reps'
      ? t('suggested', { reps: item.targetReps ?? 0 })
      : item.metric === 'time'
        ? t('suggestedSeconds', { seconds: item.targetSeconds ?? 0 })
        : t('suggestedDistance', {
            distance: number.format(displayDistance(item.targetDistanceM ?? 0, unit)),
            unit,
          });

  const mainButton = 'min-h-14 w-full rounded-xl text-lg font-bold';

  let controls;
  if (countdown) {
    controls = (
      <div className="text-center" aria-live="assertive">
        <p className="text-sm font-medium tracking-wide text-ink/60 uppercase dark:text-paper/60">
          {t('getReady')}
        </p>
        <p className="font-display text-8xl font-bold text-quake tabular-nums">
          {Math.max(1, countdownLeft)}
        </p>
        <button
          type="button"
          className="mt-2 min-h-11 text-sm font-medium text-ink/70 underline dark:text-paper/70"
          onClick={() => setCountdown({ ...countdown, until: Date.now() })}
        >
          {t('startNow')}
        </button>
      </div>
    );
  } else if (rest) {
    controls = (
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-ink/60 dark:text-paper/60">
          {t('rest')}
        </p>
        <p className="font-display text-6xl font-bold tabular-nums" aria-live="polite">
          {clock(restLeft)}
        </p>
        <p className="mt-1 text-sm">{rest.label}</p>
        <p className="mt-2 text-sm font-semibold text-quake">
          {tAll(`motivation.${style}.${motivationKey(setsDone)}`)}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="secondary"
            className="min-h-14"
            onClick={() => setRest({ ...rest, until: rest.until + 15_000 })}
          >
            {t('addRest')}
          </Button>
          <Button
            type="button"
            className="col-span-2 min-h-14 text-lg"
            onClick={() => setRest(null)}
          >
            {t('skipRest')}
          </Button>
        </div>
      </div>
    );
  } else if (item.metric === 'time') {
    const left = Math.max(0, target - elapsedMs / 1000);
    controls = (
      <div className="text-center">
        <p className="text-sm text-ink/70 dark:text-paper/70">{suggestion}</p>
        <p className="font-display text-7xl font-bold tabular-nums" aria-live="off">
          {clock(Math.ceil(left))}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {timer.running ? (
            <Button type="button" variant="secondary" className="min-h-14" onClick={pauseTimer}>
              {t('pause')}
            </Button>
          ) : (
            <Button type="button" className="min-h-14 text-lg" onClick={startTimedSet}>
              {elapsedMs > 0 ? t('resume') : t('startTimer')}
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            className="min-h-14"
            onClick={() => {
              const done = Math.round(elapsedMs / 1000);
              setTimer({ running: false, since: 0, before: 0 });
              completeSet({ ...draft, seconds: done });
            }}
          >
            {elapsedMs > 0 ? t('stopEarly') : t('skipSet')}
          </Button>
        </div>
      </div>
    );
  } else if (item.metric === 'distance') {
    controls = (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink/70 dark:text-paper/70">{suggestion}</span>
          <span className="font-display text-4xl font-bold tabular-nums">
            {clock(elapsedMs / 1000)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {timer.running ? (
            <Button type="button" variant="secondary" className="min-h-12" onClick={pauseTimer}>
              {t('pause')}
            </Button>
          ) : (
            <Button type="button" variant="secondary" className="min-h-12" onClick={startTimer}>
              {elapsedMs > 0 ? t('resume') : t('startTimer')}
            </Button>
          )}
          <span className="self-center text-sm text-ink/70 dark:text-paper/70">
            {t('distance', { unit })}
          </span>
        </div>
        <Stepper
          value={distanceShown}
          step={unit === 'km' ? 0.1 : 0.1}
          decimals={2}
          label={t('distance', { unit })}
          lessLabel={t('less')}
          moreLabel={t('more')}
          onFocusChange={() => setTouch((n) => n + 1)}
          onChange={(v) => change({ distanceM: v === null ? null : distanceToM(v, unit) })}
        />
        <button
          type="button"
          className={cn(mainButton, 'bg-quake text-white active:bg-quake/80')}
          onClick={() => {
            setTimer({ running: false, since: 0, before: 0 });
            completeSet({ ...draft, seconds: Math.round(elapsedMs / 1000) });
          }}
        >
          {t('done')}
        </button>
      </div>
    );
  } else {
    controls = (
      <div className="space-y-3">
        <p className="text-center text-sm text-ink/70 dark:text-paper/70">
          {suggestion}
          {item.targetWeightKg !== null
            ? ` · ${number.format(displayWeight(item.targetWeightKg, weightUnit, weightUnit === 'kg' ? 0.25 : 0.5))} ${weightUnit}`
            : ''}
        </p>
        <Stepper
          big
          value={draft.reps}
          step={1}
          label={t('reps')}
          lessLabel={t('less')}
          moreLabel={t('more')}
          onFocusChange={() => setTouch((n) => n + 1)}
          onChange={(v) => change({ reps: v })}
        />
        {item.weighted ? (
          <div>
            <p className="mb-1 text-xs font-medium text-ink/60 dark:text-paper/60">
              {t('weight', { unit: weightUnit })}
            </p>
            <Stepper
              value={weightShown}
              step={weightInputStep(weightUnit)}
              decimals={2}
              label={t('weight', { unit: weightUnit })}
              lessLabel={t('less')}
              moreLabel={t('more')}
              onFocusChange={() => setTouch((n) => n + 1)}
              onChange={(v) => change({ weightKg: v === null ? null : weightToKg(v, weightUnit) })}
            />
          </div>
        ) : null}
        <button
          type="button"
          className={cn(mainButton, 'bg-quake text-white active:bg-quake/80 disabled:opacity-50')}
          disabled={draft.reps === null}
          onClick={() => completeSet(draft)}
        >
          {t('setDone')}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-paper text-ink dark:bg-ink dark:text-paper">
      <header className="flex items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <span className="font-display text-xl font-bold tabular-nums" aria-label={t('elapsed')}>
          {clock(totalSeconds)}
        </span>
        <span className="flex-1 text-center text-sm text-ink/70 dark:text-paper/70">
          {t('progress', { current: itemIndex + 1, total })}
        </span>
        <VoiceMenu round />
        <button
          type="button"
          onClick={() => setMenu(true)}
          className="flex size-11 items-center justify-center rounded-full border border-ink/15 text-lg dark:border-paper/20"
          aria-label={t('close')}
        >
          ✕
        </button>
      </header>
      <div className="mx-4 h-1.5 overflow-hidden rounded-full bg-ink/10 dark:bg-paper/10">
        <div
          className="h-full rounded-full bg-quake transition-all"
          style={{ width: `${(itemIndex / total) * 100}%` }}
        />
      </div>

      {/* The exercise: the moving figure fills the background, the name stays readable on top. */}
      <section className="relative min-h-0 flex-1 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(228,87,46,0.10),transparent_65%)]"
        />
        {def ? (
          <StickFigure
            motion={def.motion}
            prop={def.prop}
            scenes={equipmentScenes(item.equipment)}
            className="absolute inset-x-0 top-10 bottom-0 mx-auto h-[calc(100%-2.5rem)] w-full max-w-md text-ink/85 dark:text-paper/85"
            title={name(item)}
          />
        ) : null}
        <div className="relative px-4 pt-3">
          {item.phase === 'warmup' ? (
            <span className="mb-1 inline-block rounded-full bg-quake/15 px-2 py-0.5 text-xs font-semibold text-quake">
              {tAll('phases.warmup')}
            </span>
          ) : null}
          <div className="flex items-start gap-2">
            <h1 className="flex-1 font-display text-2xl leading-tight font-bold">{name(item)}</h1>
            <button
              type="button"
              onClick={() => setShowHowTo(!showHowTo)}
              aria-expanded={showHowTo}
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-paper/80 text-sm font-bold dark:border-paper/20 dark:bg-ink/80"
              aria-label={t('howTo')}
            >
              ?
            </button>
          </div>
          <p className="text-sm font-medium text-ink/70 dark:text-paper/70">
            {t('set', { set: Math.min(setNo, item.sets), sets: item.sets })}
            {setNo === item.sets && item.sets > 1 ? (
              <span className="ml-2 rounded-full bg-quake px-2 py-0.5 text-xs font-semibold text-white">
                {t('lastSet')}
              </span>
            ) : null}
          </p>
          {showHowTo ? (
            <p className="mt-2 max-w-md rounded-lg bg-paper/90 p-3 text-sm shadow-sm dark:bg-ink/90">
              {tAll(`exercises.${item.slug}.howTo`)}
            </p>
          ) : null}
        </div>
      </section>

      <section className="border-t border-ink/10 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-paper/10">
        <div className="mx-auto max-w-md">
          {controls}
          <p
            className="mt-2 h-4 text-center text-xs text-ink/50 dark:text-paper/50"
            aria-live="polite"
          >
            {sync === 'signedOut' ? (
              <a href={signInUrl} className="font-medium text-quake underline">
                {t('signedOutShort')}
              </a>
            ) : sync === 'offline' ? (
              t('offlineShort')
            ) : sync === 'saving' ? (
              t('saving')
            ) : (
              ''
            )}
          </p>
        </div>
      </section>

      {menu ? (
        <div
          className="fixed inset-0 z-40 flex items-end bg-ink/50 sm:items-center sm:justify-center"
          onClick={() => setMenu(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wo-stop-title"
            className="w-full space-y-2 rounded-t-2xl bg-paper p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-w-sm sm:rounded-2xl dark:bg-ink"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="wo-stop-title" className="font-display text-lg font-bold">
              {t('exitTitle')}
            </h2>
            <Button type="button" className="min-h-12 w-full" onClick={finishNow}>
              {t('finishNow')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-12 w-full text-red-700 dark:text-red-400"
              onClick={() => void discard()}
            >
              {t('discard')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-12 w-full"
              onClick={() => setMenu(false)}
            >
              {t('keepGoing')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

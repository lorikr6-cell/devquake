'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, cn, LOCALE_TAGS, useLocale, useT } from '@devquake/ui';
import {
  DAY_MINUTES,
  MAX_DURATION,
  MIN_DURATION,
  WEEKDAYS,
  findOverlap,
  formatTime,
  parseTime,
  slotsForDay,
  type PlanSlot,
  type Weekday,
} from '../lib/plan';
import {
  REMIND_CHOICES,
  calendarPlatform,
  googleCalendarUrl,
  type CalendarPlatform,
} from '../lib/reminders';
import { isSignedOut, keepDraft, takeDraft } from './draft-rescue';
import { SignedOutNotice } from './signed-out-notice';
import { callApi, errorMessage } from './call-api';
import { ErrorText, Field, fieldClass, Input, Panel } from './ui';
import { useAppRouter } from './use-app-router';

export interface PlanEntryView extends PlanSlot {
  id: number;
  label: string;
  remindMinutes: number | null;
}

export interface PlanRoutineOption {
  id: number;
  label: string;
  /** Default length of a slot: the routine's estimate. */
  minutes: number;
}

const DRAFT_KEY = 'dq-workout:plan-draft';

interface Draft {
  routineId: number;
  repeat: 'daily' | Weekday;
  start: string;
  duration: number;
  /** '' = no reminder. */
  remind: string;
}

/**
 * The workout plan (ADR 0018): routines at a time of day, every day or on chosen weekdays, as
 * many per day as the person likes, never overlapping. The form checks overlaps as they type
 * (the server checks again when saving) and says which slot is in the way.
 */
export function PlanEditor({
  entries,
  routines,
  today,
  initialRoutine,
  hostUrl,
}: {
  entries: PlanEntryView[];
  routines: PlanRoutineOption[];
  today: Weekday;
  initialRoutine?: number;
  /** DevQuake's address, to sign in again when the sign-in has ended. */
  hostUrl: string;
}) {
  const t = useT('plan');
  const te = useT('errors');
  const locale = useLocale();
  const router = useAppRouter();
  const dayName = useMemo(() => {
    const f = new Intl.DateTimeFormat(LOCALE_TAGS[locale], { weekday: 'long', timeZone: 'UTC' });
    return (d: Weekday) => f.format(Date.UTC(2024, 0, d)); // 1 January 2024 was a Monday
  }, [locale]);

  const firstRoutine = routines.find((r) => r.id === initialRoutine) ?? routines[0];
  const blank = (routine = firstRoutine): Draft => ({
    routineId: routine?.id ?? 0,
    repeat: today,
    start: '07:00',
    duration: routine?.minutes ?? 30,
    remind: '30',
  });
  const [draft, setDraft] = useState<Draft>(() => blank());
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  /** "Added: Legs, Monday at 07:00" after saving (ADR 0019). */
  const [notice, setNotice] = useState('');
  // Which calendar the device uses: Apple (the .ics opens in Calendar), Android (Google Calendar
  // links) or a computer (the file downloads; Google Calendar links as an option).
  const [platform, setPlatform] = useState<CalendarPlatform>('desktop');
  useEffect(() => setPlatform(calendarPlatform(navigator.userAgent)), []);
  // Unsaved work kept when the sign-in ended: back after signing in again.
  const [signedOut, setSignedOut] = useState(false);
  useEffect(() => {
    const kept = takeDraft<{ draft: Draft; editing: number | null }>(DRAFT_KEY);
    if (!kept) return;
    setDraft(kept.draft);
    setEditing(kept.editing);
    setNotice(t('restored'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = parseTime(draft.start);
  const candidate: PlanSlot | null =
    start === null
      ? null
      : {
          routineId: draft.routineId,
          weekday: draft.repeat === 'daily' ? null : draft.repeat,
          start,
          duration: draft.duration,
        };
  const pastMidnight = candidate !== null && candidate.start + candidate.duration > DAY_MINUTES;
  const clash = candidate
    ? (findOverlap(entries, candidate, editing ?? undefined) as PlanEntryView | null)
    : null;
  const invalid =
    !candidate ||
    !draft.routineId ||
    pastMidnight ||
    draft.duration < MIN_DURATION ||
    draft.duration > MAX_DURATION;

  const save = async () => {
    if (!candidate || invalid || clash) return;
    setBusy(true);
    setError('');
    try {
      const body = {
        routineId: draft.routineId,
        weekday: draft.repeat,
        start: draft.start,
        duration: draft.duration,
        remindMinutes: draft.remind === '' ? null : Number(draft.remind),
      };
      if (editing) await callApi(`/plan/${editing}`, 'PUT', body);
      else await callApi('/plan', 'POST', body);
      // Confirm what was planned, and go back to the top of the form for the next one.
      const routine = routines.find((r) => r.id === draft.routineId);
      setNotice(
        t(editing ? 'changed' : 'added', {
          name: routine?.label ?? '',
          day: draft.repeat === 'daily' ? t('everyDay') : dayName(draft.repeat),
          time: `${draft.start}–${formatTime(candidate.start + candidate.duration)}`,
        }),
      );
      setEditing(null);
      setDraft(blank());
      router.refresh();
      document.getElementById('plan-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      if (isSignedOut(err)) {
        keepDraft(DRAFT_KEY, { draft, editing });
        setSignedOut(true);
      } else setError(errorMessage(err, te));
    } finally {
      setBusy(false);
    }
  };

  const edit = (entry: PlanEntryView) => {
    setEditing(entry.id);
    setError('');
    setNotice('');
    setDraft({
      routineId: entry.routineId,
      repeat: entry.weekday ?? 'daily',
      start: formatTime(entry.start),
      duration: entry.duration,
      remind: entry.remindMinutes === null ? '' : String(entry.remindMinutes),
    });
    document.getElementById('plan-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const remove = async (entry: PlanEntryView) => {
    if (!window.confirm(t('deleteConfirm', { name: entry.label }))) return;
    try {
      await callApi(`/plan/${entry.id}`, 'DELETE');
      if (editing === entry.id) {
        setEditing(null);
        setDraft(blank());
      }
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, te));
    }
  };

  if (routines.length === 0) {
    return <p className="text-sm text-ink/70 dark:text-paper/70">{t('noRoutines')}</p>;
  }

  const range = (s: PlanSlot) => `${formatTime(s.start)}–${formatTime(s.start + s.duration)}`;

  /** One "Add to Google Calendar" link per planned workout, repeating like the plan. */
  const googleLinks = () => {
    const firstDay = new Date().toISOString().slice(0, 10);
    return [...entries]
      .sort((a, b) => (a.weekday ?? 0) - (b.weekday ?? 0) || a.start - b.start)
      .map((e) => (
        <li key={e.id}>
          <a
            href={googleCalendarUrl({
              slot: e,
              title: e.label,
              details: `${t('calendarDescription')} ${formatTime(e.start)}`,
              firstDay,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-2 text-sm font-medium text-quake hover:underline"
          >
            <span aria-hidden>+</span>
            {t('googleAdd', {
              day: e.weekday === null ? t('everyDay') : dayName(e.weekday),
              time: formatTime(e.start),
              name: e.label,
            })}
          </a>
        </li>
      ));
  };

  return (
    <div className="space-y-6">
      <Panel>
        <form
          id="plan-form"
          className="scroll-mt-32 space-y-4"
          onSubmit={(ev) => {
            ev.preventDefault();
            void save();
          }}
        >
          <h2 className="font-display text-lg font-bold">
            {editing ? t('editTitle') : t('addTitle')}
          </h2>
          {notice ? (
            <p
              role="status"
              className="flex items-start gap-2 rounded-md bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-950 dark:bg-emerald-900/60 dark:text-emerald-100"
            >
              <span aria-hidden>✓</span>
              {notice}
            </p>
          ) : null}
          <Field label={t('routine')}>
            <select
              value={draft.routineId}
              onChange={(ev) => {
                const routine = routines.find((r) => r.id === Number(ev.target.value));
                setDraft((d) => ({
                  ...d,
                  routineId: Number(ev.target.value),
                  duration: routine?.minutes ?? d.duration,
                }));
              }}
              className={fieldClass}
            >
              {routines.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('repeat')} hint={t('repeatHint')}>
            <select
              value={String(draft.repeat)}
              onChange={(ev) =>
                setDraft((d) => ({
                  ...d,
                  repeat:
                    ev.target.value === 'daily' ? 'daily' : (Number(ev.target.value) as Weekday),
                }))
              }
              className={fieldClass}
            >
              <option value="daily">{t('everyDay')}</option>
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>
                  {t('everyWeekday', { day: dayName(d) })}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('start')}>
              <Input
                type="time"
                required
                value={draft.start}
                step={300}
                onChange={(ev) => setDraft((d) => ({ ...d, start: ev.target.value }))}
              />
            </Field>
            <Field
              label={t('duration')}
              hint={
                candidate && !pastMidnight
                  ? t('ends', { time: formatTime(candidate.start + candidate.duration) })
                  : undefined
              }
            >
              <Input
                type="number"
                inputMode="numeric"
                min={MIN_DURATION}
                max={MAX_DURATION}
                step={5}
                value={draft.duration}
                onChange={(ev) =>
                  setDraft((d) => ({ ...d, duration: Number(ev.target.value) || 0 }))
                }
              />
            </Field>
          </div>
          <Field label={t('reminder')} hint={t('reminderHint')}>
            <select
              value={draft.remind}
              onChange={(ev) => setDraft((d) => ({ ...d, remind: ev.target.value }))}
              className={fieldClass}
            >
              <option value="">{t('reminderNone')}</option>
              {REMIND_CHOICES.map((m) => (
                <option key={m} value={m}>
                  {m === 0 ? t('reminderAtStart') : t('reminderBefore', { minutes: m })}
                </option>
              ))}
            </select>
          </Field>
          {pastMidnight ? <ErrorText>{te('planMidnight')}</ErrorText> : null}
          {clash ? (
            <p
              role="alert"
              className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-950 dark:bg-amber-900/60 dark:text-amber-100"
            >
              {t('clash', {
                name: clash.label,
                time: range(clash),
                day: clash.weekday === null ? t('everyDay') : dayName(clash.weekday),
              })}
            </p>
          ) : null}
          <ErrorText>{error}</ErrorText>
          {signedOut ? <SignedOutNotice hostUrl={hostUrl} /> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="min-h-11" disabled={busy || invalid || !!clash}>
              {busy ? t('saving') : editing ? t('saveChange') : t('add')}
            </Button>
            {editing ? (
              <Button
                type="button"
                variant="secondary"
                className="min-h-11"
                onClick={() => {
                  setEditing(null);
                  setDraft(blank());
                  setError('');
                }}
              >
                {t('cancel')}
              </Button>
            ) : null}
          </div>
        </form>
      </Panel>

      <section aria-labelledby="plan-week">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="plan-week" className="font-display text-xl font-bold">
            {t('weekTitle')}
          </h2>
          {entries.length && platform !== 'android' ? (
            // The phone's or computer's own calendar can then remind too (ADR 0019).
            <a
              href="/api/plan.ics"
              type="text/calendar"
              className="inline-flex min-h-11 items-center rounded-md border border-ink/15 px-3 text-sm font-medium hover:border-quake dark:border-paper/20"
            >
              {platform === 'apple' ? t('calendarDownload') : t('calendarFile')}
            </a>
          ) : null}
        </div>
        {entries.length ? (
          platform === 'android' ? (
            // Google Calendar on Android cannot import a file of repeating events: one link per
            // planned workout opens it with the workout filled in.
            <div className="mt-2 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
              <p className="text-sm font-medium">{t('googleTitle')}</p>
              <p className="text-xs text-ink/60 dark:text-paper/60">{t('googleHint')}</p>
              <ul className="mt-2 space-y-1.5">{googleLinks()}</ul>
              <p className="mt-2 text-xs text-ink/60 dark:text-paper/60">
                {t('googleOther')}{' '}
                <a href="/api/plan.ics" className="font-medium underline">
                  {t('calendarFile')}
                </a>
              </p>
            </div>
          ) : platform === 'apple' ? (
            <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{t('calendarHint')}</p>
          ) : (
            <>
              <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">
                {t('calendarDesktopHint')}
              </p>
              <details className="mt-2 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
                <summary className="cursor-pointer text-sm font-medium">{t('googleTitle')}</summary>
                <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{t('googleHint')}</p>
                <ul className="mt-2 space-y-1.5">{googleLinks()}</ul>
              </details>
            </>
          )
        ) : null}
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">{t('empty')}</p>
        ) : null}
        <ol className="mt-3 grid gap-3 lg:grid-cols-7">
          {WEEKDAYS.map((d) => {
            const slots = slotsForDay(entries, d);
            return (
              <li
                key={d}
                className={cn(
                  'rounded-xl border p-3 lg:min-h-40',
                  d === today
                    ? 'border-quake/60 bg-quake/5 dark:bg-quake/10'
                    : 'border-ink/10 dark:border-paper/10',
                )}
              >
                <h3 className="flex items-center justify-between gap-2 text-sm font-semibold">
                  <span className="capitalize">{dayName(d)}</span>
                  {d === today ? (
                    <span className="rounded-full bg-quake px-2 py-0.5 text-xs text-white">
                      {t('today')}
                    </span>
                  ) : null}
                </h3>
                {slots.length === 0 ? (
                  <p className="mt-2 text-xs text-ink/50 dark:text-paper/50">{t('restDay')}</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {slots.map((s) => (
                      <li
                        key={s.id}
                        className={cn(
                          'rounded-lg bg-white/80 p-2 text-sm dark:bg-paper/5',
                          editing === s.id && 'ring-2 ring-quake',
                        )}
                      >
                        <p className="font-medium tabular-nums">
                          {range(s)}
                          {s.remindMinutes !== null ? (
                            <span
                              className="ml-1"
                              title={
                                s.remindMinutes === 0
                                  ? t('reminderAtStart')
                                  : t('reminderBefore', { minutes: s.remindMinutes })
                              }
                              aria-label={
                                s.remindMinutes === 0
                                  ? t('reminderAtStart')
                                  : t('reminderBefore', { minutes: s.remindMinutes })
                              }
                            >
                              🔔
                            </span>
                          ) : null}
                        </p>
                        <p className="break-words">{s.label}</p>
                        {s.weekday === null ? (
                          <p className="text-xs text-ink/60 dark:text-paper/60">{t('everyDay')}</p>
                        ) : null}
                        <div className="mt-1 flex gap-3 text-xs">
                          <button
                            type="button"
                            onClick={() => edit(s)}
                            className="font-medium underline-offset-2 hover:underline"
                            aria-label={t('editSlot', { name: s.label, time: range(s) })}
                          >
                            {t('edit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => void remove(s)}
                            className="font-medium text-red-700 underline-offset-2 hover:underline dark:text-red-400"
                            aria-label={t('deleteSlot', { name: s.label, time: range(s) })}
                          >
                            {t('delete')}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

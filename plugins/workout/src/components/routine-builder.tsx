'use client';

import { useMemo, useState } from 'react';
import { Button, Link, cn, useLocale, useT, LOCALE_TAGS } from '@devquake/ui';
import { StickFigure } from '../illustrations/stick-figure';
import { routineEstimate } from '../lib/calories';
import { LOCATIONS, type HandProp, type Location } from '../lib/catalog';
import { prescribe } from '../lib/generator';
import type { ExerciseInfo, PlannedItem, Profile } from '../lib/model';
import { MAX_ROUTINE_ITEMS, ROUTINE_NAME_MAX } from '../lib/routine-input';
import { displayDistance, distanceToM, type DistanceUnit } from '../lib/units';
import { callApi, errorMessage } from './call-api';
import { ErrorText, Field, fieldClass, Input, Panel } from './ui';
import { useAppRouter } from './use-app-router';

export interface BuilderExercise extends ExerciseInfo {
  muscles: string[];
  motion: string;
  prop: HandProp | null;
}

type Row = PlannedItem & { key: number };

const ROLES = ['all', 'warmup', 'strength', 'core', 'cardio'] as const;
type RoleFilter = (typeof ROLES)[number];

/** Sensible starting values for a newly added exercise: the generator's suggestion. */
function defaults(e: BuilderExercise, profile: Profile, older: boolean): PlannedItem {
  if (e.role === 'warmup') {
    return {
      slug: e.slug,
      phase: 'warmup',
      sets: 1,
      repsMin: e.metric === 'reps' ? 10 : null,
      repsMax: e.metric === 'reps' ? 10 : null,
      targetReps: e.metric === 'reps' ? 10 : null,
      seconds: e.metric === 'time' ? 45 : null,
      distanceM: e.metric === 'distance' ? 1000 : null,
      restSeconds: 15,
    };
  }
  if (e.metric === 'distance') {
    return {
      slug: e.slug,
      phase: 'main',
      sets: 1,
      repsMin: null,
      repsMax: null,
      targetReps: null,
      seconds: null,
      distanceM: e.role === 'cardio' && e.speed > 2.5 ? 3000 : 2000,
      restSeconds: 0,
    };
  }
  return prescribe(e, profile, older);
}

/**
 * The routine builder (ADR 0018): a name, a place, and exercises from the catalogue in any
 * order, each with its sets, repetitions (or seconds, or distance) and rest. New exercises start
 * with the app's suggestion for the person's profile. The estimate updates as they build.
 */
export function RoutineBuilder({
  routineId,
  initial,
  exercises,
  profile,
  older,
  unit,
}: {
  /** Editing an own routine; undefined for a new one. */
  routineId?: number;
  initial: { name: string; location: Location; items: PlannedItem[] };
  exercises: BuilderExercise[];
  profile: Profile;
  older: boolean;
  unit: DistanceUnit;
}) {
  const t = useT('builder');
  const tr = useT();
  const te = useT('errors');
  const locale = useLocale();
  const router = useAppRouter();
  const [name, setName] = useState(initial.name);
  const [location, setLocation] = useState<Location>(initial.location);
  const [rows, setRows] = useState<Row[]>(() =>
    initial.items.map((item, key) => ({ ...item, key })),
  );
  const [nextKey, setNextKey] = useState(initial.items.length);
  const [picking, setPicking] = useState(initial.items.length === 0);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const bySlug = useMemo(() => new Map(exercises.map((e) => [e.slug, e])), [exercises]);
  const exerciseName = (slug: string) => tr(`exercises.${slug}.name`);
  const number = new Intl.NumberFormat(LOCALE_TAGS[locale], { maximumFractionDigits: 2 });
  const estimate = routineEstimate(rows, (slug) => bySlug.get(slug), profile.weightKg);
  // Exercises that do not fit the chosen place are flagged; saving would be refused.
  const misplaced = rows.filter((r) => !bySlug.get(r.slug)?.places.includes(location));

  const choices = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    return exercises.filter(
      (e) =>
        e.places.includes(location) &&
        (role === 'all' || e.role === role) &&
        (!q || tr(`exercises.${e.slug}.name`).toLocaleLowerCase().includes(q)),
    );
  }, [exercises, location, role, search, tr]);

  const update = (key: number, patch: Partial<PlannedItem>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const move = (index: number, by: -1 | 1) =>
    setRows((rs) => {
      const next = [...rs];
      const [row] = next.splice(index, 1);
      next.splice(index + by, 0, row!);
      return next;
    });
  const add = (e: BuilderExercise) => {
    setRows((rs) => [...rs, { ...defaults(e, profile, older), key: nextKey }]);
    setNextKey((k) => k + 1);
    setPicking(false);
    setSearch('');
  };

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const body = { name, location, items: rows.map(({ key: _key, ...item }) => item) };
      if (routineId) {
        await callApi(`/routines/${routineId}`, 'PUT', body);
        router.push(`/routines/${routineId}`);
      } else {
        const res = await callApi<{ id: number }>('/routines', 'POST', body);
        router.push(`/routines/${res!.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, te));
      setBusy(false);
    }
  };

  const numberField = (
    label: string,
    value: number | null,
    onChange: (n: number) => void,
    props: { min: number; max: number; step?: number },
  ) => (
    <Field label={label} className="min-w-0">
      <Input
        type="number"
        inputMode={props.step && props.step < 1 ? 'decimal' : 'numeric'}
        value={value ?? ''}
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        onChange={(ev) => {
          const n = Number(ev.target.value);
          if (ev.target.value !== '' && Number.isFinite(n)) onChange(n);
        }}
        className="px-2 py-2 text-center tabular-nums"
      />
    </Field>
  );

  return (
    <form
      className="space-y-5"
      onSubmit={(ev) => {
        ev.preventDefault();
        void save();
      }}
    >
      <Panel className="space-y-4">
        <Field label={t('name')}>
          <Input
            value={name}
            required
            maxLength={ROUTINE_NAME_MAX}
            placeholder={t('namePlaceholder')}
            onChange={(ev) => setName(ev.target.value)}
          />
        </Field>
        <fieldset>
          <legend className="mb-1 text-sm font-medium">{t('place')}</legend>
          <div className="grid grid-cols-3 gap-2">
            {LOCATIONS.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={location === l}
                onClick={() => setLocation(l)}
                className={cn(
                  'min-h-11 rounded-md border px-2 text-sm font-medium',
                  location === l
                    ? 'border-quake bg-quake/10 text-ink dark:text-paper'
                    : 'border-ink/15 text-ink/70 hover:border-ink/30 dark:border-paper/15 dark:text-paper/70',
                )}
              >
                {tr(`locations.${l}.name`)}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="text-sm text-ink/70 dark:text-paper/70" aria-live="polite">
          {t('summary', { count: rows.length })}
          {rows.length
            ? ` · ${tr('dashboard.estimate', {
                minutes: Math.round(estimate.seconds / 60),
                kcal: number.format(estimate.kcal),
              })}`
            : ''}
        </p>
      </Panel>

      {rows.length ? (
        <ol className="space-y-3">
          {rows.map((row, index) => {
            const e = bySlug.get(row.slug);
            if (!e) return null;
            const wrongPlace = !e.places.includes(location);
            return (
              <li key={row.key}>
                <Panel className={cn('space-y-3', wrongPlace && 'border-red-500/60')}>
                  <div className="flex items-start gap-3">
                    <StickFigure
                      motion={e.motion}
                      prop={e.prop}
                      still
                      className="size-14 shrink-0 text-ink/70 dark:text-paper/70"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        <span className="mr-1 text-ink/50 tabular-nums dark:text-paper/50">
                          {index + 1}.
                        </span>
                        {exerciseName(row.slug)}
                      </p>
                      <div className="mt-1 inline-flex rounded-full border border-ink/15 p-0.5 text-xs dark:border-paper/15">
                        {(['warmup', 'main'] as const).map((phase) => (
                          <button
                            key={phase}
                            type="button"
                            aria-pressed={row.phase === phase}
                            onClick={() => update(row.key, { phase })}
                            className="rounded-full px-2.5 py-1 aria-pressed:bg-ink aria-pressed:text-paper dark:aria-pressed:bg-paper dark:aria-pressed:text-ink"
                          >
                            {tr(`phases.${phase}`)}
                          </button>
                        ))}
                      </div>
                      {wrongPlace ? (
                        <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                          {t('wrongPlace', { place: tr(`locations.${location}.name`) })}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        aria-label={t('moveUp', { name: exerciseName(row.slug) })}
                        className="size-9 rounded-md border border-ink/15 disabled:opacity-30 dark:border-paper/15"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={index === rows.length - 1}
                        onClick={() => move(index, 1)}
                        aria-label={t('moveDown', { name: exerciseName(row.slug) })}
                        className="size-9 rounded-md border border-ink/15 disabled:opacity-30 dark:border-paper/15"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {e.metric !== 'distance'
                      ? numberField(t('sets'), row.sets, (n) => update(row.key, { sets: n }), {
                          min: 1,
                          max: 10,
                        })
                      : null}
                    {e.metric === 'reps' ? (
                      <>
                        {numberField(
                          t('repsFrom'),
                          row.repsMin,
                          (n) =>
                            update(row.key, {
                              repsMin: n,
                              targetReps: n,
                              repsMax: Math.max(n, row.repsMax ?? n),
                            }),
                          { min: 1, max: 200 },
                        )}
                        {numberField(
                          t('repsTo'),
                          row.repsMax,
                          (n) => update(row.key, { repsMax: n }),
                          { min: row.repsMin ?? 1, max: 200 },
                        )}
                      </>
                    ) : null}
                    {e.metric === 'time'
                      ? numberField(
                          t('seconds'),
                          row.seconds,
                          (n) => update(row.key, { seconds: n }),
                          {
                            min: 5,
                            max: 3600,
                          },
                        )
                      : null}
                    {e.metric === 'distance'
                      ? numberField(
                          t('distance', { unit }),
                          row.distanceM === null ? null : displayDistance(row.distanceM, unit),
                          (n) => update(row.key, { distanceM: distanceToM(n, unit) }),
                          { min: 0.1, max: 100, step: 0.1 },
                        )
                      : null}
                    {numberField(
                      t('rest'),
                      row.restSeconds,
                      (n) => update(row.key, { restSeconds: n }),
                      {
                        min: 0,
                        max: 600,
                      },
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                    className="text-sm font-medium text-red-700 underline-offset-2 hover:underline dark:text-red-400"
                  >
                    {t('remove', { name: exerciseName(row.slug) })}
                  </button>
                </Panel>
              </li>
            );
          })}
        </ol>
      ) : null}

      {picking ? (
        <Panel className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold">{t('addTitle')}</h2>
            {rows.length ? (
              <button type="button" onClick={() => setPicking(false)} className="text-sm underline">
                {t('closePicker')}
              </button>
            ) : null}
          </div>
          <input
            type="search"
            value={search}
            onChange={(ev) => setSearch(ev.target.value)}
            placeholder={t('search')}
            aria-label={t('search')}
            className={fieldClass}
          />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('filter')}>
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={role === r}
                onClick={() => setRole(r)}
                className="min-h-9 rounded-full border border-ink/15 px-3 text-sm aria-pressed:border-quake aria-pressed:bg-quake/10 dark:border-paper/15"
              >
                {t(`roles.${r}`)}
              </button>
            ))}
          </div>
          {choices.length === 0 ? (
            <p className="text-sm text-ink/60 dark:text-paper/60">{t('noMatch')}</p>
          ) : (
            <ul className="grid max-h-[28rem] gap-2 overflow-y-auto sm:grid-cols-2">
              {choices.map((e) => (
                <li key={e.slug}>
                  <button
                    type="button"
                    onClick={() => add(e)}
                    disabled={rows.length >= MAX_ROUTINE_ITEMS}
                    className="flex w-full items-center gap-3 rounded-lg border border-ink/10 p-2 text-left hover:border-quake disabled:opacity-50 dark:border-paper/10"
                  >
                    <StickFigure
                      motion={e.motion}
                      prop={e.prop}
                      still
                      className="size-12 shrink-0 text-ink/70 dark:text-paper/70"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{exerciseName(e.slug)}</span>
                      <span className="block truncate text-xs text-ink/60 dark:text-paper/60">
                        {e.muscles.map((m) => tr(`muscles.${m}`)).join(', ') ||
                          t(`roles.${e.role}`)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 w-full"
          disabled={rows.length >= MAX_ROUTINE_ITEMS}
          onClick={() => setPicking(true)}
        >
          + {t('add')}
        </Button>
      )}

      <ErrorText>{error}</ErrorText>
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          className="min-h-11 flex-1 sm:flex-none"
          disabled={busy || !name.trim() || rows.length === 0 || misplaced.length > 0}
        >
          {busy ? t('saving') : routineId ? t('save') : t('create')}
        </Button>
        <Link
          href={routineId ? `/routines/${routineId}` : '/'}
          className="inline-flex min-h-11 items-center rounded-md px-4 text-sm font-medium underline-offset-2 hover:underline"
        >
          {t('cancel')}
        </Link>
      </div>
    </form>
  );
}

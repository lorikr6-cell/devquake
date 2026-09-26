'use client';

import { useEffect, useState } from 'react';
import { Button, Link, cn, useT } from '@devquake/ui';
import { autoMotion, autoProp } from '../illustrations/auto';
import { StickFigure } from '../illustrations/stick-figure';
import {
  EQUIPMENT_SLUGS,
  LOCATIONS,
  MUSCLES,
  type Location,
  type Metric,
  type Role,
} from '../lib/catalog';
import {
  EXERCISE_HOWTO_MAX,
  EXERCISE_NAME_MAX,
  METRICS,
  PATTERNS_BY_ROLE,
  ROLES,
} from '../lib/exercise-input';
import { isSignedOut, keepDraft, takeDraft } from './draft-rescue';
import { SignedOutNotice } from './signed-out-notice';
import { callApi, errorMessage } from './call-api';
import { ErrorText, Field, fieldClass, Input, Panel } from './ui';
import { useAppRouter } from './use-app-router';

export interface ExerciseFormValues {
  name: string;
  howTo: string;
  role: Role;
  pattern: string;
  metric: Metric;
  places: Location[];
  equipment: string[];
  muscles: string[];
  difficulty: number;
  weighted: boolean;
  lowImpact: boolean;
}

/** A group of toggle buttons (places, equipment, muscles). */
function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
  name,
}: {
  label: string;
  options: readonly T[];
  value: readonly T[];
  onChange: (next: T[]) => void;
  name: (option: T) => string;
}) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])}
              className={cn(
                'min-h-9 rounded-full border px-3 text-sm',
                on
                  ? 'border-quake bg-quake/10 font-medium'
                  : 'border-ink/15 text-ink/75 dark:border-paper/15 dark:text-paper/75',
              )}
            >
              {name(o)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Create or change an own exercise (ADR 0019): name, kind, movement, how it is measured, where,
 * equipment, muscles, difficulty and an optional description. The animation is chosen
 * automatically and previewed as they choose.
 */
export function ExerciseForm({
  exerciseId,
  initial,
  hostUrl,
}: {
  exerciseId?: number;
  initial: ExerciseFormValues;
  /** DevQuake's address, to sign in again when the sign-in has ended. */
  hostUrl: string;
}) {
  const t = useT('ownExercises');
  const tr = useT();
  const te = useT('errors');
  const router = useAppRouter();
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [signedOut, setSignedOut] = useState(false);
  const draftKey = `dq-workout:exercise-draft:${exerciseId ?? 'new'}`;
  // Unsaved work kept when the sign-in ended: back after signing in again.
  useEffect(() => {
    const kept = takeDraft<ExerciseFormValues>(draftKey);
    if (kept) setV(kept);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (patch: Partial<ExerciseFormValues>) => setV((old) => ({ ...old, ...patch }));
  const patterns = PATTERNS_BY_ROLE[v.role];
  const pattern = patterns.includes(v.pattern as never) ? v.pattern : patterns[0]!;
  const motion = autoMotion({ pattern, role: v.role, metric: v.metric, equipment: v.equipment });

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const body = { ...v, pattern };
      if (exerciseId) await callApi(`/exercises/${exerciseId}`, 'PUT', body);
      else await callApi('/exercises', 'POST', body);
      router.push('/exercises');
      router.refresh();
    } catch (err) {
      if (isSignedOut(err)) {
        keepDraft(draftKey, v);
        setSignedOut(true);
      } else setError(errorMessage(err, te));
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      await callApi(`/exercises/${exerciseId}`, 'DELETE');
      router.push('/exercises');
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, te));
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(ev) => {
        ev.preventDefault();
        void save();
      }}
    >
      <Panel className="flex items-center gap-4">
        <StickFigure
          motion={motion}
          prop={autoProp(v.equipment)}
          className="size-28 shrink-0 text-ink/80 dark:text-paper/80"
          title={v.name || t('preview')}
        />
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('previewHint')}</p>
      </Panel>

      <Panel className="space-y-4">
        <Field label={t('name')}>
          <Input
            value={v.name}
            required
            minLength={2}
            maxLength={EXERCISE_NAME_MAX}
            placeholder={t('namePlaceholder')}
            onChange={(ev) => set({ name: ev.target.value })}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('kind')}>
            <select
              value={v.role}
              onChange={(ev) => set({ role: ev.target.value as Role })}
              className={fieldClass}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {tr(`builder.roles.${r}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('movement')}>
            <select
              value={pattern}
              disabled={patterns.length === 1}
              onChange={(ev) => set({ pattern: ev.target.value })}
              className={fieldClass}
            >
              {patterns.map((p) => (
                <option key={p} value={p}>
                  {t(`patterns.${p}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('metric')}>
            <select
              value={v.metric}
              onChange={(ev) => set({ metric: ev.target.value as Metric })}
              className={fieldClass}
            >
              {METRICS.map((m) => (
                <option key={m} value={m}>
                  {t(`metrics.${m}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('difficulty')}>
            <select
              value={v.difficulty}
              onChange={(ev) => set({ difficulty: Number(ev.target.value) })}
              className={fieldClass}
            >
              {[1, 2, 3].map((d) => (
                <option key={d} value={d}>
                  {t(`difficulties.d${d}`)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Chips
          label={t('places')}
          options={LOCATIONS}
          value={v.places}
          onChange={(places) => set({ places })}
          name={(l) => tr(`locations.${l}.name`)}
        />
        <Chips
          label={t('equipment')}
          options={EQUIPMENT_SLUGS}
          value={v.equipment as (typeof EQUIPMENT_SLUGS)[number][]}
          onChange={(equipment) => set({ equipment })}
          name={(q) => tr(`equipment.${q}`)}
        />
        <Chips
          label={t('muscles')}
          options={MUSCLES}
          value={v.muscles as (typeof MUSCLES)[number][]}
          onChange={(muscles) => set({ muscles })}
          name={(m) => tr(`muscles.${m}`)}
        />
        <div className="space-y-2">
          {v.metric === 'reps' ? (
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="size-5 accent-quake"
                checked={v.weighted}
                onChange={(ev) => set({ weighted: ev.target.checked })}
              />
              {t('weighted')}
            </label>
          ) : null}
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="size-5 accent-quake"
              checked={v.lowImpact}
              onChange={(ev) => set({ lowImpact: ev.target.checked })}
            />
            {t('lowImpact')}
          </label>
        </div>
        <Field label={t('howTo')} hint={t('howToHint')}>
          <textarea
            value={v.howTo}
            rows={3}
            maxLength={EXERCISE_HOWTO_MAX}
            onChange={(ev) => set({ howTo: ev.target.value })}
            className={fieldClass}
          />
        </Field>
      </Panel>

      <ErrorText>{error}</ErrorText>
      {signedOut ? <SignedOutNotice hostUrl={hostUrl} /> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          className="min-h-11"
          disabled={busy || v.name.trim().length < 2 || v.places.length === 0}
        >
          {busy ? t('saving') : exerciseId ? t('save') : t('create')}
        </Button>
        <Link href="/exercises" className="px-3 text-sm font-medium hover:underline">
          {t('cancel')}
        </Link>
        {exerciseId ? (
          confirmDelete ? (
            <span className="flex flex-wrap items-center gap-2 text-sm">
              {t('deleteConfirmText')}
              <Button
                type="button"
                className="min-h-11 bg-red-700 text-white hover:bg-red-800"
                disabled={busy}
                onClick={() => void remove()}
              >
                {t('deleteConfirm')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-11"
                onClick={() => setConfirmDelete(false)}
              >
                {t('cancel')}
              </Button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="ml-auto text-sm font-medium text-red-700 hover:underline dark:text-red-400"
            >
              {t('delete')}
            </button>
          )
        ) : null}
      </div>
    </form>
  );
}

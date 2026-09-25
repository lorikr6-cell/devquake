'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, cn, useT } from '@devquake/ui';
import { LOCATION_ICONS } from '../illustrations/icons';
import { LOCATIONS, type Location } from '../lib/catalog';
import { EXPERIENCES, GOALS, SESSION_MINUTES, type Experience, type Goal } from '../lib/model';
import {
  cmToFeetInches,
  displayWeight,
  feetInchesToCm,
  weightToKg,
  type HeightUnit,
  type WeightUnit,
} from '../lib/units';
import type { UserSetup } from '../lib/data';
import { callApi, errorMessage } from './call-api';
import { PhotoSlot, uploadProgressPhoto } from './photo-slot';
import { ErrorText, Field, Input, Panel, SvgIcon } from './ui';
import { useAppRouter } from './use-app-router';

export interface EquipmentOption {
  slug: string;
  home: boolean;
  iconSvg: string;
}

type Step = 'about' | 'training' | 'places' | 'equipment' | 'photo';

/** Big tappable choices (radio or checkbox look), one per row on phones. */
function Choices<T extends string>({
  options,
  selected,
  onToggle,
  multiple = false,
  label,
  columns = 1,
}: {
  options: { value: T; title: string; hint?: string; icon?: string }[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  multiple?: boolean;
  label: string;
  columns?: 1 | 2;
}) {
  return (
    <div
      role={multiple ? 'group' : 'radiogroup'}
      aria-label={label}
      className={cn('grid gap-2', columns === 2 && 'grid-cols-2')}
    >
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={on}
            onClick={() => onToggle(o.value)}
            className={cn(
              'flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
              on
                ? 'border-quake bg-quake/10 dark:bg-quake/15'
                : 'border-ink/15 hover:bg-ink/5 dark:border-paper/15 dark:hover:bg-paper/10',
            )}
          >
            {o.icon ? (
              <SvgIcon
                svg={o.icon}
                className={cn('size-7', on ? 'text-quake' : 'text-ink/70 dark:text-paper/70')}
              />
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{o.title}</span>
              {o.hint ? (
                <span className="block text-xs text-ink/60 dark:text-paper/60">{o.hint}</span>
              ) : null}
            </span>
            <span
              aria-hidden
              className={cn(
                'flex size-5 shrink-0 items-center justify-center border text-xs',
                multiple ? 'rounded' : 'rounded-full',
                on ? 'border-quake bg-quake text-white' : 'border-ink/30 dark:border-paper/30',
              )}
            >
              {on ? '✓' : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function UnitSwitch<T extends string>({
  units,
  value,
  onChange,
  label,
}: {
  units: readonly T[];
  value: T;
  onChange: (u: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-md border border-ink/15 p-0.5 dark:border-paper/15"
    >
      {units.map((u) => (
        <button
          key={u}
          type="button"
          role="radio"
          aria-checked={value === u}
          onClick={() => onChange(u)}
          className={cn(
            'min-w-11 rounded px-2 py-1 text-sm font-medium',
            value === u
              ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
              : 'text-ink/70 dark:text-paper/70',
          )}
        >
          {u}
        </button>
      ))}
    </div>
  );
}

/**
 * The first-visit wizard (`mode="wizard"`, one group of questions per screen) and the profile
 * page (`mode="edit"`, everything on one page). Heights and weights are typed in the person's
 * unit and sent in cm and kg (ADR 0013).
 */
export function SetupForm({
  initial,
  equipment,
  mode,
  year,
  startPhoto = null,
}: {
  initial: UserSetup | null;
  equipment: EquipmentOption[];
  mode: 'wizard' | 'edit';
  year: number;
  /** The starting photo, shown on the profile page (ADR 0015). */
  startPhoto?: { id: number; version: string } | null;
}) {
  const t = useT('profile');
  const ts = useT('setup');
  const te = useT('errors');
  const tAll = useT();
  const router = useAppRouter();
  const p = initial?.profile;

  const [birthYear, setBirthYear] = useState(p ? String(p.birthYear) : '');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>(p?.heightUnit ?? 'cm');
  const [heightCm, setHeightCm] = useState(p ? String(Math.round(p.heightCm)) : '');
  const feet0 = p ? cmToFeetInches(p.heightCm) : null;
  const [feet, setFeet] = useState(feet0 ? String(feet0.feet) : '');
  const [inches, setInches] = useState(feet0 ? String(feet0.inches) : '');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(p?.weightUnit ?? 'kg');
  const [weight, setWeight] = useState(p ? String(displayWeight(p.weightKg, p.weightUnit)) : '');
  const [experience, setExperience] = useState<Experience>(p?.experience ?? 'beginner');
  const [goal, setGoal] = useState<Goal>(p?.goal ?? 'general');
  const [daysPerWeek, setDaysPerWeek] = useState(p?.daysPerWeek ?? 3);
  const [sessionMinutes, setSessionMinutes] = useState(p?.sessionMinutes ?? 45);
  const [lowImpact, setLowImpact] = useState(p?.lowImpact ?? false);
  const [locations, setLocations] = useState<Location[]>(initial?.locations ?? []);
  const [owned, setOwned] = useState<string[]>(initial?.equipment ?? []);
  const [regenerate, setRegenerate] = useState(false);
  const [step, setStep] = useState<Step>('about');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [monthlyEmail, setMonthlyEmail] = useState(initial?.monthlyEmail ?? true);
  // Wizard: the optional starting photo, uploaded after the profile is saved.
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!photo) return setPreview('');
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const steps: Step[] = [
    'about',
    'training',
    'places',
    ...(locations.includes('home') ? (['equipment'] as const) : []),
    'photo',
  ];
  const stepIndex = steps.indexOf(step);

  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const changeHeightUnit = (u: HeightUnit) => {
    if (u === heightUnit) return;
    if (u === 'ft' && heightCm) {
      const fi = cmToFeetInches(Number(heightCm.replace(',', '.')));
      setFeet(String(fi.feet));
      setInches(String(fi.inches));
    } else if (u === 'cm' && feet) {
      setHeightCm(String(Math.round(feetInchesToCm(Number(feet), Number(inches || 0)))));
    }
    setHeightUnit(u);
  };

  const changeWeightUnit = (u: WeightUnit) => {
    if (u === weightUnit) return;
    const value = Number(weight.replace(',', '.'));
    if (weight && Number.isFinite(value))
      setWeight(String(displayWeight(weightToKg(value, weightUnit), u)));
    setWeightUnit(u);
  };

  const number = (s: string) => Number(s.replace(',', '.'));
  const aboutComplete =
    birthYear !== '' && weight !== '' && (heightUnit === 'cm' ? heightCm !== '' : feet !== '');

  const save = async () => {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      if (mode === 'wizard' && profileSaved) {
        // The profile is saved; only the photo upload failed before.
        if (photo) await uploadProgressPhoto('start', 'current', photo, te);
        router.push('/');
        router.refresh();
        return;
      }
      await callApi('/profile', 'PUT', {
        birthYear: number(birthYear),
        heightCm:
          heightUnit === 'cm'
            ? number(heightCm)
            : feetInchesToCm(number(feet), number(inches || '0')),
        weightKg: weightToKg(number(weight), weightUnit),
        weightUnit,
        heightUnit,
        experience,
        goal,
        daysPerWeek,
        sessionMinutes,
        lowImpact,
        locations,
        equipment: locations.includes('home') ? owned : [],
        regenerate: mode === 'wizard' || regenerate,
        monthlyEmail,
      });
      if (mode === 'wizard') {
        setProfileSaved(true);
        if (photo) await uploadProgressPhoto('start', 'current', photo, te);
        router.push('/');
        router.refresh();
      } else {
        setSaved(true);
        setRegenerate(false);
        router.refresh();
      }
    } catch (err) {
      setError(errorMessage(err, te));
    } finally {
      setBusy(false);
    }
  };

  const about = (
    <div className="space-y-4">
      <Field label={t('birthYear')} hint={t('birthYearHint')}>
        <Input
          inputMode="numeric"
          autoComplete="bday-year"
          value={birthYear}
          min={year - 100}
          max={year - 13}
          placeholder={String(year - 30)}
          onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
        />
      </Field>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{t('height')}</span>
          <UnitSwitch
            units={['cm', 'ft'] as const}
            value={heightUnit}
            onChange={changeHeightUnit}
            label={t('unit')}
          />
        </div>
        {heightUnit === 'cm' ? (
          <Input
            inputMode="decimal"
            aria-label={t('height')}
            value={heightCm}
            placeholder="175"
            onChange={(e) => setHeightCm(e.target.value)}
          />
        ) : (
          <div className="flex gap-2">
            <Input
              inputMode="numeric"
              aria-label={t('feet')}
              value={feet}
              placeholder="5"
              onChange={(e) => setFeet(e.target.value.replace(/\D/g, '').slice(0, 1))}
            />
            <span className="self-center text-sm">{t('feet')}</span>
            <Input
              inputMode="numeric"
              aria-label={t('inches')}
              value={inches}
              placeholder="9"
              onChange={(e) => setInches(e.target.value.replace(/\D/g, '').slice(0, 2))}
            />
            <span className="self-center text-sm">{t('inches')}</span>
          </div>
        )}
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{t('weight')}</span>
          <UnitSwitch
            units={['kg', 'lb'] as const}
            value={weightUnit}
            onChange={changeWeightUnit}
            label={t('unit')}
          />
        </div>
        <Input
          inputMode="decimal"
          aria-label={t('weight')}
          value={weight}
          placeholder={weightUnit === 'kg' ? '75' : '165'}
          onChange={(e) => setWeight(e.target.value)}
        />
      </div>
    </div>
  );

  const training = (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium">{t('experience')}</p>
        <Choices
          label={t('experience')}
          options={EXPERIENCES.map((v) => ({
            value: v,
            title: tAll(`experience.${v}.label`),
            hint: tAll(`experience.${v}.hint`),
          }))}
          selected={[experience]}
          onToggle={setExperience}
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">{t('goal')}</p>
        <Choices
          label={t('goal')}
          options={GOALS.map((v) => ({
            value: v,
            title: tAll(`goals.${v}.label`),
            hint: tAll(`goals.${v}.hint`),
          }))}
          selected={[goal]}
          onToggle={setGoal}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('daysPerWeek')}>
          <select
            className="w-full rounded-md border border-ink/15 bg-white px-3 py-2.5 text-base dark:border-paper/15 dark:bg-ink"
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('sessionMinutes')}>
          <select
            className="w-full rounded-md border border-ink/15 bg-white px-3 py-2.5 text-base dark:border-paper/15 dark:bg-ink"
            value={sessionMinutes}
            onChange={(e) => setSessionMinutes(Number(e.target.value))}
          >
            {SESSION_MINUTES.map((m) => (
              <option key={m} value={m}>
                {tAll('common.minutes', { minutes: m })}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Choices
        label={t('lowImpact')}
        multiple
        options={[{ value: 'on', title: t('lowImpact'), hint: t('lowImpactHint') }]}
        selected={lowImpact ? ['on'] : []}
        onToggle={() => setLowImpact(!lowImpact)}
      />
    </div>
  );

  const places = (
    <Choices
      label={ts('placesTitle')}
      multiple
      options={LOCATIONS.map((l) => ({
        value: l,
        title: tAll(`locations.${l}.name`),
        hint: tAll(`locations.${l}.description`),
        icon: LOCATION_ICONS[l],
      }))}
      selected={locations}
      onToggle={(l) => setLocations(toggle(locations, l))}
    />
  );

  const gear = (
    <Choices
      label={ts('equipmentTitle')}
      multiple
      columns={2}
      options={equipment
        .filter((e) => e.home)
        .map((e) => ({ value: e.slug, title: tAll(`equipment.${e.slug}`), icon: e.iconSvg }))}
      selected={owned}
      onToggle={(slug) => setOwned(toggle(owned, slug))}
    />
  );

  const monthlyEmailChoice = (
    <Choices
      label={t('monthlyEmail')}
      multiple
      options={[{ value: 'on', title: t('monthlyEmail'), hint: t('monthlyEmailHint') }]}
      selected={monthlyEmail ? ['on'] : []}
      onToggle={() => setMonthlyEmail(!monthlyEmail)}
    />
  );

  const photoStep = (
    <div className="space-y-4">
      <div className="mx-auto w-48">
        {preview ? (
          <img
            src={preview}
            alt={ts('photoTitle')}
            className="aspect-[3/4] w-full rounded-xl object-cover"
          />
        ) : (
          <div className="flex aspect-[3/4] w-full items-center justify-center rounded-xl border-2 border-dashed border-ink/15 p-4 text-center text-sm text-ink/60 dark:border-paper/20 dark:text-paper/60">
            {ts('photoEmpty')}
          </div>
        )}
      </div>
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="user"
        hidden
        onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
      />
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          className="min-h-12 flex-1"
          onClick={() => cameraInput.current?.click()}
        >
          {ts('photoTake')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-12 flex-1"
          onClick={() => fileInput.current?.click()}
        >
          {ts('photoPick')}
        </Button>
      </div>
      {photo ? (
        <button
          type="button"
          className="min-h-11 text-sm text-ink/70 underline dark:text-paper/70"
          onClick={() => setPhoto(null)}
        >
          {ts('photoRemove')}
        </button>
      ) : null}
      <p className="text-xs text-ink/60 dark:text-paper/60">{ts('photoPrivacy')}</p>
      {monthlyEmailChoice}
    </div>
  );

  if (mode === 'edit') {
    const section = (title: string, body: ReactNode, hint?: string) => (
      <Panel>
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {hint ? <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">{hint}</p> : null}
        <div className="mt-4">{body}</div>
      </Panel>
    );
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        {section(ts('aboutTitle'), about)}
        {section(ts('trainingTitle'), training)}
        {section(t('places'), places, ts('placesHint'))}
        {locations.includes('home') ? section(t('equipment'), gear, ts('equipmentHint')) : null}
        {section(
          t('photoAndEmail'),
          <div className="grid gap-4 sm:grid-cols-2">
            <PhotoSlot kind="start" period="current" photo={startPhoto} title={ts('photoTitle')} />
            <div id="email">{monthlyEmailChoice}</div>
          </div>,
          ts('photoHint'),
        )}
        <Panel>
          <Choices
            label={t('regenerate')}
            multiple
            options={[{ value: 'on', title: t('regenerate'), hint: t('regenerateHint') }]}
            selected={regenerate ? ['on'] : []}
            onToggle={() => setRegenerate(!regenerate)}
          />
          <div className="mt-4 flex items-center gap-3">
            <Button
              type="submit"
              disabled={busy || !aboutComplete || locations.length === 0}
              className="min-h-11 flex-1 sm:flex-none"
            >
              {busy ? tAll('common.saving') : t('save')}
            </Button>
            {saved ? (
              <span className="text-sm text-green-700 dark:text-green-400">{t('saved')}</span>
            ) : null}
          </div>
          <div className="mt-2">
            <ErrorText>{error}</ErrorText>
          </div>
        </Panel>
      </form>
    );
  }

  const bodies: Record<Step, ReactNode> = {
    about,
    training,
    places,
    equipment: gear,
    photo: photoStep,
  };
  const titles: Record<Step, string> = {
    about: ts('aboutTitle'),
    training: ts('trainingTitle'),
    places: ts('placesTitle'),
    equipment: ts('equipmentTitle'),
    photo: ts('photoTitle'),
  };
  const hints: Partial<Record<Step, string>> = {
    places: ts('placesHint'),
    equipment: ts('equipmentHint'),
    photo: ts('photoHint'),
  };
  const canGoOn =
    step === 'about' ? aboutComplete : step === 'places' ? locations.length > 0 : true;
  const last = stepIndex === steps.length - 1;

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-xs font-medium uppercase tracking-wide text-ink/60 dark:text-paper/60">
        {ts('step', { step: stepIndex + 1, steps: steps.length })}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10 dark:bg-paper/10">
        <div
          className="h-full rounded-full bg-quake transition-all"
          style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold">{titles[step]}</h1>
      {hints[step] ? (
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{hints[step]}</p>
      ) : null}
      <form
        className="mt-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canGoOn) return;
          if (last) void save();
          else setStep(steps[stepIndex + 1]!);
        }}
      >
        {bodies[step]}
        {step === 'about' ? (
          <p className="mt-4 text-xs text-ink/60 dark:text-paper/60">{ts('disclaimer')}</p>
        ) : null}
        <div className="mt-6 flex gap-3">
          {stepIndex > 0 ? (
            <Button
              type="button"
              variant="secondary"
              className="min-h-12 flex-1"
              onClick={() => setStep(steps[stepIndex - 1]!)}
            >
              {ts('back')}
            </Button>
          ) : null}
          <Button type="submit" className="min-h-12 flex-[2]" disabled={!canGoOn || busy}>
            {busy ? ts('creating') : last ? (photo ? ts('finish') : ts('finishSkip')) : ts('next')}
          </Button>
        </div>
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      </form>
    </div>
  );
}

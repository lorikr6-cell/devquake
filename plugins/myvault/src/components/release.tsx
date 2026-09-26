'use client';

import { useState, type FormEvent } from 'react';
import { Button, rich, useT } from '@devquake/ui';
import { MAX_INACTIVE_DAYS, MIN_INACTIVE_DAYS } from '../lib/model';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Select } from './ui';
import { useAction } from './use-action';

export interface Person {
  id: number;
  displayName: string;
  hasAccess: boolean;
}

export interface ReleaseDraft {
  recipients: number[];
  amount: string;
  unit: 'days' | 'months';
  notBefore: string;
}

export const emptyRelease = (): ReleaseDraft => ({
  recipients: [],
  amount: '3',
  unit: 'months',
  notBefore: '',
});

/** Months count as 30 days. */
export function inactiveDays(d: ReleaseDraft): number {
  const n = Math.round(Number(d.amount));
  return d.unit === 'months' ? n * 30 : n;
}

export function releaseBody(d: ReleaseDraft) {
  return d.recipients.length
    ? { recipients: d.recipients, inactiveDays: inactiveDays(d), notBefore: d.notBefore || null }
    : { recipients: [] };
}

/** Who receives the vault key, and after how long without activity (and not before which day). */
export function ReleaseFields({
  people,
  value,
  onChange,
  hostUrl,
}: {
  people: Person[];
  value: ReleaseDraft;
  onChange: (d: ReleaseDraft) => void;
  hostUrl: string;
}) {
  const t = useT('release');
  const days = inactiveDays(value);
  const invalid =
    value.recipients.length > 0 && (!(days >= MIN_INACTIVE_DAYS) || days > MAX_INACTIVE_DAYS);
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">{t('recipients')}</p>
        <p className="text-xs text-ink/60 dark:text-paper/60">{t('recipientsHint')}</p>
        {people.length === 0 ? (
          <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">
            {rich(t('nobody'), {
              link: (
                <a className="font-medium text-quake underline" href={`${hostUrl}/#account`}>
                  {t('inviteLink')}
                </a>
              ),
            })}
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {people.map((p) => (
              <li key={p.id}>
                <label className="flex min-h-9 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-quake"
                    checked={value.recipients.includes(p.id)}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        recipients: e.target.checked
                          ? [...value.recipients, p.id]
                          : value.recipients.filter((x) => x !== p.id),
                      })
                    }
                  />
                  {p.displayName}
                </label>
              </li>
            ))}
          </ul>
        )}
        {value.recipients.length === 0 ? (
          <p className="mt-2 rounded-md bg-ink/5 px-3 py-2 text-sm dark:bg-paper/10">
            🔒 {t('private')}
          </p>
        ) : null}
      </div>
      {value.recipients.length ? (
        <>
          <div className="grid grid-cols-[1fr_1fr] gap-3">
            <Field label={t('after')}>
              <Input
                inputMode="numeric"
                required
                value={value.amount}
                onChange={(e) => onChange({ ...value, amount: e.target.value })}
              />
            </Field>
            <Field label={t('unit')}>
              <Select
                value={value.unit}
                onChange={(e) =>
                  onChange({ ...value, unit: e.target.value as ReleaseDraft['unit'] })
                }
              >
                <option value="days">{t('days')}</option>
                <option value="months">{t('months')}</option>
              </Select>
            </Field>
          </div>
          <p className="text-xs text-ink/60 dark:text-paper/60">
            {t('afterHint', { days: Number.isFinite(days) ? days : 0 })}
          </p>
          {invalid ? (
            <ErrorText>{t('range', { min: MIN_INACTIVE_DAYS, max: MAX_INACTIVE_DAYS })}</ErrorText>
          ) : null}
          <Field label={t('notBefore')} hint={t('notBeforeHint')}>
            <Input
              type="date"
              value={value.notBefore}
              onChange={(e) => onChange({ ...value, notBefore: e.target.value })}
            />
          </Field>
        </>
      ) : null}
    </div>
  );
}

/** Entry page: change who receives the key; the vault key is needed once to seal it. */
export function ReleaseForm({
  entryId,
  people,
  initial,
  hostUrl,
  knownKey,
}: {
  entryId: number;
  people: Person[];
  initial: ReleaseDraft;
  hostUrl: string;
  /** The key typed when the entry was opened on this page, if it was. */
  knownKey: string | null;
}) {
  const t = useT('release');
  const { busy, error, act } = useAction();
  const [draft, setDraft] = useState(initial);
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    act(async () => {
      await callApi(`/entries/${entryId}/release`, 'PUT', {
        ...releaseBody(draft),
        vaultKey: knownKey ?? key,
      });
      setSaved(true);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ReleaseFields people={people} value={draft} onChange={setDraft} hostUrl={hostUrl} />
      {draft.recipients.length && !knownKey ? (
        <Field label={t('keyNeeded')} hint={t('keyNeededHint')}>
          <Input
            required
            value={key}
            autoComplete="off"
            spellCheck={false}
            className="font-mono uppercase"
            onChange={(e) => setKey(e.target.value)}
          />
        </Field>
      ) : null}
      <ErrorText>{error}</ErrorText>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? t('saving') : t('save')}
        </Button>
        {saved ? (
          <span className="text-sm text-emerald-700 dark:text-emerald-400">{t('saved')}</span>
        ) : null}
      </div>
    </form>
  );
}

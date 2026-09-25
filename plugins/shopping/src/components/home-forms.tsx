'use client';

import { useState, type FormEvent } from 'react';
import { Button, trackEvent, useT } from '@devquake/ui';
import type { IsoDate } from '../lib/dates';
import { CURRENCIES, INVITE_CODE_PATTERN } from '../lib/model';
import { callApi, errorMessage } from './call-api';
import { ErrorText, Field, Input, Select } from './ui';
import { useAppRouter } from './use-app-router';
import { useToday } from './use-today';

export function CreateListForm({ serverToday }: { serverToday: IsoDate }) {
  const router = useAppRouter();
  const t = useT('forms');
  const tErr = useT('errors');
  const today = useToday(serverToday);
  // The date follows "today" until the user picks one.
  const [picked, setPicked] = useState<IsoDate | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const res = await callApi<{ id: number }>('/lists', 'POST', {
        name: form.get('name'),
        currency: form.get('currency'),
        shopDate: form.get('shopDate'),
      });
      trackEvent('list_created', { planned_ahead: (picked ?? today) > today });
      router.push(`/lists/${res!.id}`);
    } catch (err) {
      setError(errorMessage(err, tErr));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3">
      <Field label={t('name')}>
        <Input name="name" required maxLength={80} placeholder={t('namePlaceholder')} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('date')}>
          <Input
            type="date"
            name="shopDate"
            required
            value={picked ?? today}
            onChange={(e) => setPicked(e.target.value || null)}
          />
        </Field>
        <Field label={t('currency')}>
          <Select name="currency" defaultValue="RON">
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy}>
        {busy ? t('creating') : t('create')}
      </Button>
    </form>
  );
}

export function JoinForm() {
  const router = useAppRouter();
  const t = useT('forms');
  const [error, setError] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get('code') ?? '')
      .trim()
      .toUpperCase();
    if (!INVITE_CODE_PATTERN.test(code)) {
      setError(t('codeInvalid'));
      return;
    }
    router.push(`/join/${code}`);
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3">
      <Field label={t('code')} hint={t('codeHint')}>
        <Input
          name="code"
          required
          maxLength={8}
          autoComplete="off"
          className="font-mono uppercase tracking-widest"
          placeholder="K7MPX2QA"
        />
      </Field>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" variant="secondary">
        {t('continue')}
      </Button>
    </form>
  );
}

/** "Join this list" on the invitation page. */
export function JoinButton({ code }: { code: string }) {
  const router = useAppRouter();
  const t = useT('forms');
  const tErr = useT('errors');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function join() {
    setBusy(true);
    setError('');
    try {
      const res = await callApi<{ id: number }>('/join', 'POST', { code });
      trackEvent('list_joined', { method: 'invite' });
      router.push(`/lists/${res!.id}`);
    } catch (err) {
      setError(errorMessage(err, tErr));
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 space-y-2">
      <Button onClick={join} disabled={busy}>
        {busy ? t('joining') : t('join')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

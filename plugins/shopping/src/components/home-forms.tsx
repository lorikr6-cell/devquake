'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@devquake/ui';
import { CURRENCIES, INVITE_CODE_PATTERN } from '../lib/model';
import { callApi, errorMessage } from './call-api';
import { ErrorText, Field, Input, Select } from './ui';

export function CreateListForm() {
  const router = useRouter();
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
      });
      router.push(`/lists/${res!.id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3">
      <Field label="Name">
        <Input name="name" required maxLength={80} placeholder="Weekly groceries" />
      </Field>
      <Field label="Currency">
        <Select name="currency" defaultValue="RON">
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </Field>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy}>
        {busy ? 'Creating…' : 'Create list'}
      </Button>
    </form>
  );
}

export function JoinForm() {
  const router = useRouter();
  const [error, setError] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get('code') ?? '')
      .trim()
      .toUpperCase();
    if (!INVITE_CODE_PATTERN.test(code)) {
      setError('Invite codes have 8 letters and digits, like K7MPX2QA.');
      return;
    }
    router.push(`/join/${code}`);
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3">
      <Field label="Invite code" hint="Ask the list owner for the code or scan their QR code.">
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
        Continue
      </Button>
    </form>
  );
}

/** "Join this list" on the invitation page. */
export function JoinButton({ code }: { code: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function join() {
    setBusy(true);
    setError('');
    try {
      const res = await callApi<{ id: number }>('/join', 'POST', { code });
      router.push(`/lists/${res!.id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 space-y-2">
      <Button onClick={join} disabled={busy}>
        {busy ? 'Joining…' : 'Join this list'}
      </Button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@devquake/ui';
import { CURRENCIES } from '../lib/model';
import { callApi, errorMessage } from './call-api';
import { ErrorText, Field, Input, Select } from './ui';

/** Runs an API call, then re-renders the server page; returns the error message, if any. */
function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function act(change: () => Promise<unknown>, after?: () => void) {
    setBusy(true);
    setError('');
    try {
      await change();
      if (after) after();
      else router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, act, router };
}

export function CopyButton({ text, label = 'Copy link' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          prompt('Copy this:', text);
        }
      }}
    >
      {copied ? 'Copied' : label}
    </Button>
  );
}

export function RotateInviteButton({ listId }: { listId: number }) {
  const { busy, error, act } = useAction();
  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        onClick={() => {
          if (confirm('Make a new invite link? The current link and code stop working.')) {
            act(() => callApi(`/lists/${listId}/invite`, 'POST'));
          }
        }}
      >
        New link
      </Button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}

export function AddFriendButton({
  listId,
  userId,
  name,
}: {
  listId: number;
  userId: number;
  name: string;
}) {
  const { busy, error, act } = useAction();
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        disabled={busy}
        onClick={() => act(() => callApi(`/lists/${listId}/members`, 'POST', { userId }))}
        aria-label={`Add ${name} to this list`}
      >
        {busy ? 'Adding…' : 'Add to list'}
      </Button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}

export function RemoveMemberButton({
  listId,
  userId,
  name,
  leave = false,
}: {
  listId: number;
  userId: number;
  name: string;
  leave?: boolean;
}) {
  const { busy, error, act, router } = useAction();
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        className="text-red-700 dark:text-red-400"
        onClick={() => {
          const question = leave ? 'Leave this list?' : `Remove ${name} from this list?`;
          if (confirm(question)) {
            act(
              () => callApi(`/lists/${listId}/members/${userId}`, 'DELETE'),
              leave ? () => router.push('/') : undefined,
            );
          }
        }}
      >
        {leave ? 'Leave list' : 'Remove'}
      </Button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}

export function ListSettingsForm({
  listId,
  name,
  currency,
}: {
  listId: number;
  name: string;
  currency: string;
}) {
  const { busy, error, act, router } = useAction();

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    act(() =>
      callApi(`/lists/${listId}`, 'PATCH', {
        name: form.get('name'),
        currency: form.get('currency'),
      }),
    );
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name" className="sm:col-span-2">
          <Input name="name" required maxLength={80} defaultValue={name} />
        </Field>
        <Field label="Currency">
          <Select name="currency" defaultValue={currency}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          Save
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="ml-auto text-red-700 dark:text-red-400"
          disabled={busy}
          onClick={() => {
            if (confirm(`Delete “${name}” with all its items and stores for everyone?`)) {
              act(
                () => callApi(`/lists/${listId}`, 'DELETE'),
                () => router.push('/'),
              );
            }
          }}
        >
          Delete list
        </Button>
      </div>
    </form>
  );
}

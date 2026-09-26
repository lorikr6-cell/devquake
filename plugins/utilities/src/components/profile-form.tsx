'use client';

import { useState, type FormEvent } from 'react';
import { Button, useT } from '@devquake/ui';
import { callApi } from './call-api';
import { ErrorText, Field, Input, TextArea } from './ui';
import { useAction } from './use-action';

/** Full name and address (asked once, editable later on /profile). */
export function ProfileForm({
  initial,
  next,
}: {
  initial: { fullName: string; address: string } | null;
  /** Where to go after saving (an app path), or null to stay. */
  next: string | null;
}) {
  const t = useT('profile');
  const { busy, error, act, router } = useAction();
  const [saved, setSaved] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    act(
      () =>
        callApi('/profile', 'PUT', {
          fullName: data.get('fullName'),
          address: data.get('address'),
        }),
      () => {
        if (next) router.push(next);
        else {
          setSaved(true);
          router.refresh();
        }
      },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t('fullName')}>
        <Input
          name="fullName"
          required
          maxLength={120}
          autoComplete="name"
          defaultValue={initial?.fullName ?? ''}
        />
      </Field>
      <Field label={t('address')} hint={t('addressHint')}>
        <TextArea
          name="address"
          required
          maxLength={255}
          autoComplete="street-address"
          defaultValue={initial?.address ?? ''}
        />
      </Field>
      <ErrorText>{error}</ErrorText>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? t('saving') : initial ? t('save') : t('continue')}
        </Button>
        {saved ? (
          <span role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
            {t('saved')}
          </span>
        ) : null}
      </div>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { Button, useT } from '@devquake/ui';
import { callApi, errorMessage } from './call-api';
import { ErrorText } from './ui';
import { useAppRouter } from './use-app-router';

/**
 * Deletes one of the person's own routines after a confirmation (ADR 0018). Its places in the
 * plan go with it; past workouts stay in the history.
 */
export function DeleteRoutineButton({ routineId, name }: { routineId: number; name: string }) {
  const t = useT('builder');
  const te = useT('errors');
  const router = useAppRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      await callApi(`/routines/${routineId}`, 'DELETE');
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, te));
      setBusy(false);
    }
  };

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="secondary"
        className="min-h-11 text-red-700 dark:text-red-400"
        onClick={() => setConfirming(true)}
      >
        {t('delete')}
      </Button>
    );
  }
  return (
    <div
      role="alertdialog"
      aria-label={t('deleteTitle', { name })}
      className="w-full space-y-2 rounded-lg border border-red-500/40 bg-red-500/5 p-3"
    >
      <p className="text-sm font-medium">{t('deleteTitle', { name })}</p>
      <p className="text-sm text-ink/70 dark:text-paper/70">{t('deleteBody')}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="min-h-11 bg-red-700 text-white hover:bg-red-800"
          disabled={busy}
          onClick={() => void remove()}
        >
          {busy ? t('deleting') : t('deleteConfirm')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11"
          disabled={busy}
          onClick={() => setConfirming(false)}
        >
          {t('cancel')}
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

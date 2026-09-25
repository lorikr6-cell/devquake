'use client';

import { useState } from 'react';
import { Button, cn, useT } from '@devquake/ui';
import { callApi, errorMessage } from './call-api';
import { ErrorText } from './ui';
import { useAppRouter } from './use-app-router';

/** Starts a workout from a routine and opens the workout screen. */
export function StartButton({
  routineId,
  className,
  label,
}: {
  routineId: number;
  className?: string;
  label?: string;
}) {
  const t = useT('routine');
  const te = useT('errors');
  const router = useAppRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const start = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await callApi<{ id: number }>('/sessions', 'POST', { routineId });
      router.push(`/workout/${res!.id}`);
    } catch (err) {
      setError(errorMessage(err, te));
      setBusy(false);
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      <Button
        type="button"
        className="min-h-11 w-full"
        disabled={busy}
        onClick={() => void start()}
      >
        {busy ? t('starting') : (label ?? t('start'))}
      </Button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

/** Discards a workout after a confirmation; everything entered in it is deleted. */
export function DiscardButton({ sessionId }: { sessionId: number }) {
  const t = useT('dashboard');
  const te = useT('errors');
  const router = useAppRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const discard = async () => {
    if (!window.confirm(t('discardConfirm'))) return;
    setBusy(true);
    try {
      await callApi(`/sessions/${sessionId}`, 'DELETE');
      try {
        localStorage.removeItem(`dq-workout:${sessionId}`);
      } catch {
        // storage may be unavailable (private mode); nothing to clean up then
      }
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, te));
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="min-h-11"
        disabled={busy}
        onClick={() => void discard()}
      >
        {t('discard')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </>
  );
}

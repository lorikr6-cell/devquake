'use client';

import { useActionState } from 'react';
import { Button, useT } from '@devquake/ui';
import { inputClass, labelClass } from '@/components/form-styles';
import { resendAction, verifyAction, type FormState } from '@/lib/auth/actions';
import { ClientContextFields } from './client-context-fields';

/** Enter the emailed one-time code; also offers to send a new one. */
export function VerifyForm() {
  const t = useT('auth');
  const [state, verify, verifying] = useActionState<FormState, FormData>(verifyAction, {});
  const [resendState, resend, resending] = useActionState<FormState, FormData>(resendAction, {});

  return (
    <div className="space-y-4">
      <form action={verify} className="space-y-4">
        <ClientContextFields />
        <div>
          <label htmlFor="code" className={labelClass}>
            {t('verify.code')}
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 \-]{6,8}"
            maxLength={8}
            required
            autoFocus
            className={`${inputClass} text-center font-mono text-2xl tracking-[0.4em]`}
          />
        </div>
        {state.error && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={verifying} className="w-full">
          {verifying ? t('checking') : t('verify.verify')}
        </Button>
      </form>

      <form action={resend} className="text-center">
        <ClientContextFields />
        <button
          type="submit"
          disabled={resending}
          className="text-sm text-ink/70 underline decoration-quake/40 underline-offset-2 hover:decoration-quake disabled:opacity-50 dark:text-paper/70"
        >
          {resending ? t('verify.sending') : t('verify.resend')}
        </button>
        {(resendState.error || resendState.info) && (
          <p
            role="status"
            className={`mt-2 text-sm ${resendState.error ? 'text-red-700 dark:text-red-400' : 'text-ink/70 dark:text-paper/70'}`}
          >
            {resendState.error ?? resendState.info}
          </p>
        )}
      </form>
    </div>
  );
}

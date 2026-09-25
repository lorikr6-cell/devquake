'use client';

import { useActionState, useState } from 'react';
import { Button, Link, rich, useT } from '@devquake/ui';
import { inputClass, labelClass } from '@/components/form-styles';
import {
  forgotPasswordAction,
  resetPasswordAction,
  type ForgotState,
  type ResetState,
} from '@/lib/auth/reset-actions';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/signup-rules';

function ErrorText({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-sm text-red-700 dark:text-red-400">
      {error}
    </p>
  );
}

/** Asks for the email address and says the link is on its way (ADR 0017). */
export function ForgotPasswordForm({ minutes }: { minutes: number }) {
  const t = useT('auth');
  const [state, send, sending] = useActionState<ForgotState, FormData>(forgotPasswordAction, {});

  if (state.sent) {
    return (
      <div role="status" className="space-y-3 text-sm">
        <p className="font-display text-xl tracking-tight">{t('forgot.sentTitle')}</p>
        <p className="text-ink/80 dark:text-paper/80">
          {rich(t('forgot.sentBody'), { email: <strong>{state.email}</strong>, minutes })}
        </p>
        <p className="text-xs text-ink/60 dark:text-paper/60">{t('forgot.spam')}</p>
        <Link
          href="/#account"
          className="font-medium underline decoration-quake/50 underline-offset-2 hover:decoration-quake"
        >
          {t('forgot.back')}
        </Link>
      </div>
    );
  }
  return (
    <form action={send} className="space-y-4">
      <div>
        <label htmlFor="forgot-email" className={labelClass}>
          {t('email')}
        </label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          defaultValue={state.email}
          autoFocus
          className={inputClass}
        />
      </div>
      <ErrorText error={state.error} />
      <Button type="submit" disabled={sending} className="w-full">
        {sending ? t('forgot.sending') : t('forgot.send')}
      </Button>
      <p className="text-center text-sm">
        <Link
          href="/#account"
          className="underline decoration-quake/40 underline-offset-2 hover:decoration-quake"
        >
          {t('forgot.back')}
        </Link>
      </p>
    </form>
  );
}

/** The new password, twice, with the same live length check as sign-up. */
export function ResetPasswordForm() {
  const t = useT('auth');
  const [state, save, saving] = useActionState<ResetState, FormData>(resetPasswordAction, {});
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const short = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const mismatch = repeat.length > 0 && repeat !== password;

  return (
    <form action={save} className="space-y-4">
      <div>
        <label htmlFor="reset-password" className={labelClass}>
          {t('signup.password', { min: MIN_PASSWORD_LENGTH })}
        </label>
        <input
          id="reset-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={256}
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby={short ? 'reset-password-hint' : undefined}
          className={inputClass}
        />
        {short && (
          <p id="reset-password-hint" className="mt-1 text-xs text-red-700 dark:text-red-400">
            {t('signup.errors.password', {
              min: MIN_PASSWORD_LENGTH,
              length: password.length,
            })}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="reset-password-confirm" className={labelClass}>
          {t('signup.repeat')}
        </label>
        <input
          id="reset-password-confirm"
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          required
          maxLength={256}
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          className={inputClass}
        />
        {mismatch ? (
          <p className="mt-1 text-xs text-red-700 dark:text-red-400">
            {t('signup.errors.mismatch')}
          </p>
        ) : repeat.length > 0 ? (
          <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">{t('signup.match')}</p>
        ) : null}
      </div>
      <ErrorText error={state.error} />
      <Button type="submit" disabled={saving || short || mismatch} className="w-full">
        {saving ? t('reset.saving') : t('reset.save')}
      </Button>
      <p className="text-xs text-ink/60 dark:text-paper/60">{t('reset.note')}</p>
    </form>
  );
}

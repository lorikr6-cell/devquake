'use client';

import { useActionState, useEffect, useState } from 'react';
import { Button, cn } from '@devquake/ui';
import { inputClass, labelClass } from '@/components/form-styles';
import { isEmail } from '@/lib/auth/signup-rules';
import { inviteAction, type InviteFormState } from '@/lib/referral-actions';

/**
 * "Invite by email": the address is checked once the user typed and left the field (like
 * sign-up), and before sending. The server checks again and sends the branded invitation.
 */
export function InviteForm() {
  const [state, action, pending] = useActionState<InviteFormState, FormData>(inviteAction, {});
  const [value, setValue] = useState('');
  const [dirty, setDirty] = useState(false);
  const [shown, setShown] = useState(false);

  // After a response: keep the address on error, clear it after a successful invite.
  useEffect(() => {
    setValue(state.ok ? '' : (state.email ?? ''));
    setDirty(false);
    setShown(false);
  }, [state]);

  const invalid = !isEmail(value.trim().toLowerCase());
  const error =
    shown && invalid ? 'Enter a valid email address, like name@example.com.' : undefined;

  return (
    <form
      action={action}
      noValidate
      onSubmit={(e) => {
        if (invalid) {
          e.preventDefault();
          setShown(true);
        }
      }}
      className="space-y-2"
    >
      <label htmlFor="invite-email" className={labelClass}>
        Invite someone by email
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="invite-email"
          name="email"
          type="email"
          autoComplete="off"
          placeholder="friend@example.com"
          maxLength={254}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setDirty(true);
          }}
          onBlur={() => dirty && setShown(true)}
          aria-invalid={error ? true : undefined}
          aria-describedby="invite-email-hint"
          className={cn(inputClass, error && 'border-red-600 dark:border-red-400')}
        />
        <Button type="submit" disabled={pending} className="shrink-0">
          {pending ? 'Sending…' : 'Send invitation'}
        </Button>
      </div>
      <p id="invite-email-hint" aria-live="polite" className="min-h-4 text-xs">
        {error ? (
          <span className="text-red-700 dark:text-red-400">{error}</span>
        ) : state.error ? (
          <span role="alert" className="text-red-700 dark:text-red-400">
            {state.error}
          </span>
        ) : state.ok ? (
          <span className="text-emerald-700 dark:text-emerald-400">
            ✓ Invitation sent to {state.sentTo}.
          </span>
        ) : (
          <span className="text-ink/60 dark:text-paper/60">
            They receive an email from DevQuake with your name, the link and the QR code.
          </span>
        )}
      </p>
    </form>
  );
}

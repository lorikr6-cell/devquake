'use client';

import { useActionState } from 'react';
import { Button } from '@devquake/ui';
import { ClientContextFields } from '@/components/auth/client-context-fields';
import { inputClass, labelClass } from '@/components/form-styles';
import { signInAction, type FormState } from '@/lib/auth/actions';

/** Step 1 of the control panel sign-in; step 2 is the emailed code on /admin-cp/verify. */
export function LoginForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(signInAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="context" value="admin-cp" />
      <ClientContextFields />
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          defaultValue={state.email}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
          className={inputClass}
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Checking…' : 'Continue'}
      </Button>
    </form>
  );
}

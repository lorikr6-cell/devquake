'use client';

import { useActionState, useState } from 'react';
import { Button, cn } from '@devquake/ui';
import { inputClass, labelClass } from '@/components/form-styles';
import { signInAction, signUpAction, type FormState } from '@/lib/auth/actions';
import { PRIVACY_PATH } from '@/lib/legal';
import { ClientContextFields } from './client-context-fields';

type Tab = 'signin' | 'signup';

function Field(props: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  minLength?: number;
  maxLength?: number;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={props.id} className={labelClass}>
        {props.label}
      </label>
      <input
        id={props.id}
        name={props.id.replace(/^(signin|signup)-/, '')}
        type={props.type ?? 'text'}
        autoComplete={props.autoComplete}
        required
        defaultValue={props.defaultValue}
        minLength={props.minLength}
        maxLength={props.maxLength ?? 256}
        className={inputClass}
      />
    </div>
  );
}

function ErrorText({ state }: { state: FormState }) {
  if (!state.error) return null;
  return (
    <p role="alert" className="text-sm text-red-700 dark:text-red-400">
      {state.error}
    </p>
  );
}

const PRIVACY_NOTE =
  'For security we record the time, IP address, approximate location, browser and device of every sign-up and sign-in.';

/** Sign in / Sign up card for the landing page. Both end on the emailed-code page. */
export function AuthCard({ initialTab = 'signin' }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [signInState, signIn, signingIn] = useActionState<FormState, FormData>(signInAction, {});
  const [signUpState, signUp, signingUp] = useActionState<FormState, FormData>(signUpAction, {});

  const tabClass = (t: Tab) =>
    cn(
      'flex-1 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
      tab === t
        ? 'border-quake text-ink dark:text-paper'
        : 'border-transparent text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper',
    );

  return (
    <div className="rounded-lg border border-ink/10 bg-white shadow-sm dark:border-paper/10 dark:bg-paper/5">
      <div role="tablist" className="flex border-b border-ink/10 dark:border-paper/10">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'signin'}
          className={tabClass('signin')}
          onClick={() => setTab('signin')}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'signup'}
          className={tabClass('signup')}
          onClick={() => setTab('signup')}
        >
          Create account
        </button>
      </div>

      <div className="p-6">
        {tab === 'signin' ? (
          <form action={signIn} className="space-y-4">
            <input type="hidden" name="context" value="site" />
            <ClientContextFields />
            <Field
              id="signin-email"
              label="Email"
              type="email"
              autoComplete="username"
              defaultValue={signInState.email}
            />
            <Field
              id="signin-password"
              label="Password"
              type="password"
              autoComplete="current-password"
            />
            <ErrorText state={signInState} />
            <Button type="submit" disabled={signingIn} className="w-full">
              {signingIn ? 'Checking…' : 'Continue'}
            </Button>
            <p className="text-xs text-ink/60 dark:text-paper/60">
              We will email you a one-time code to finish signing in.
            </p>
          </form>
        ) : (
          <form action={signUp} className="space-y-4">
            <ClientContextFields />
            <Field
              id="signup-name"
              label="Name"
              autoComplete="name"
              maxLength={100}
              defaultValue={signUpState.name}
            />
            <Field
              id="signup-email"
              label="Email"
              type="email"
              autoComplete="email"
              defaultValue={signUpState.email}
            />
            <Field
              id="signup-password"
              label="Password (at least 10 characters)"
              type="password"
              autoComplete="new-password"
              minLength={10}
            />
            <Field
              id="signup-password_confirm"
              label="Repeat password"
              type="password"
              autoComplete="new-password"
              minLength={10}
            />
            <ErrorText state={signUpState} />
            <Button type="submit" disabled={signingUp} className="w-full">
              {signingUp ? 'Creating…' : 'Create account'}
            </Button>
            <p className="text-xs text-ink/60 dark:text-paper/60">
              We will email you a code to confirm your address. {PRIVACY_NOTE}{' '}
              <a href={PRIVACY_PATH} className="underline decoration-quake/50 underline-offset-2">
                Privacy policy
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

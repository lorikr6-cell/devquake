'use client';

import { useActionState, useEffect, useState } from 'react';
import { Button, cn } from '@devquake/ui';
import { inputClass, labelClass } from '@/components/form-styles';
import { signInAction, signUpAction, type FormState } from '@/lib/auth/actions';
import { PRIVACY_PATH } from '@/lib/legal';
import { AUTH_TAB_EVENT, type AuthTab } from '@/components/section-link';
import { ClientContextFields } from './client-context-fields';
import { SignUpForm } from './signup-form';

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

export interface AuthNotice {
  tone: 'success' | 'error';
  text: string;
}

/**
 * Sign in / Sign up card for the landing page. Sign-up ends with a welcome email containing an
 * activation link; sign-in ends on the emailed-code page. `notice` shows the outcome of an
 * activation link above the sign-in form.
 */
export function AuthCard({
  initialTab = 'signin',
  notice,
  invitedBy,
  returnTo,
}: {
  initialTab?: Tab;
  notice?: AuthNotice;
  /** Shown on "Create account" when the visitor came through someone's invite link. */
  invitedBy?: string;
  /** Validated URL to open after signing in (e.g. the app the visitor came from). */
  returnTo?: string;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  // Header "Sign in" (and other SectionLinks) pick the tab; "/#signup" opens sign-up directly.
  useEffect(() => {
    const onTab = (e: Event) => setTab((e as CustomEvent<AuthTab>).detail);
    window.addEventListener(AUTH_TAB_EVENT, onTab);
    if (window.location.hash === '#signup') setTab('signup');
    return () => window.removeEventListener(AUTH_TAB_EVENT, onTab);
  }, []);
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
        {notice && tab === 'signin' && (
          <p
            role={notice.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'mb-4 rounded-md px-3 py-2 text-sm',
              notice.tone === 'success'
                ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/60 dark:text-emerald-100'
                : 'bg-amber-100 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100',
            )}
          >
            {notice.text}
          </p>
        )}
        {invitedBy && tab === 'signup' && !signUpState.signedUp && (
          <p
            role="status"
            className="mb-4 rounded-md bg-quake/10 px-3 py-2 text-sm text-ink dark:bg-quake/20 dark:text-paper"
          >
            <strong>{invitedBy}</strong> invited you to DevQuake. Create your free account below.
          </p>
        )}
        {tab === 'signup' && signUpState.signedUp ? (
          <div role="status" className="space-y-3 text-sm">
            <p className="font-display text-xl tracking-tight">Check your inbox</p>
            <p className="text-ink/80 dark:text-paper/80">
              We sent a welcome email to <strong>{signUpState.email}</strong>. Open the{' '}
              <strong>Activate my account</strong> link in it, then sign in here.
            </p>
            <p className="text-xs text-ink/60 dark:text-paper/60">
              Nothing arrived after a few minutes? Check your spam folder, or sign in with your
              email and password: we will send you a new activation link.
            </p>
            <button
              type="button"
              onClick={() => setTab('signin')}
              className="font-medium underline decoration-quake/50 underline-offset-2 hover:decoration-quake"
            >
              Go to sign in
            </button>
          </div>
        ) : tab === 'signin' ? (
          <form action={signIn} className="space-y-4">
            <input type="hidden" name="context" value="site" />
            {returnTo && <input type="hidden" name="return_to" value={returnTo} />}
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
          <SignUpForm
            action={signUp}
            state={signUpState}
            pending={signingUp}
            note={
              <>
                We will email you a link to activate your account. {PRIVACY_NOTE}{' '}
                <a href={PRIVACY_PATH} className="underline decoration-quake/50 underline-offset-2">
                  Privacy policy
                </a>
              </>
            }
          />
        )}
      </div>
    </div>
  );
}

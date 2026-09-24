'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, cn } from '@devquake/ui';
import { inputClass, labelClass } from '@/components/form-styles';
import type { FormState } from '@/lib/auth/actions';
import {
  MIN_PASSWORD_LENGTH,
  validateSignUp,
  type SignUpField,
  type SignUpValues,
} from '@/lib/auth/signup-rules';
import { ClientContextFields } from './client-context-fields';

type FieldName = SignUpField;
type Values = SignUpValues;
const MIN_PASSWORD = MIN_PASSWORD_LENGTH;
const validate = validateSignUp;

const FIELDS: Array<{
  name: FieldName;
  label: string;
  type: string;
  autoComplete: string;
  maxLength: number;
}> = [
  { name: 'name', label: 'Name', type: 'text', autoComplete: 'name', maxLength: 100 },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', maxLength: 254 },
  {
    name: 'password',
    label: `Password (at least ${MIN_PASSWORD} characters)`,
    type: 'password',
    autoComplete: 'new-password',
    maxLength: 256,
  },
  {
    name: 'password_confirm',
    label: 'Repeat password',
    type: 'password',
    autoComplete: 'new-password',
    maxLength: 256,
  },
];

/**
 * Sign-up form with live validation. A field is checked only after the user typed in it and
 * moved focus away (blur); from then on it re-checks while typing, so the message disappears as
 * soon as it is fixed. Submitting checks every field. The server validates again regardless.
 */
export function SignUpForm({
  action,
  state,
  pending,
  note,
}: {
  action: (form: FormData) => void;
  state: FormState;
  pending: boolean;
  note: React.ReactNode;
}) {
  const [values, setValues] = useState<Values>({
    name: state.name ?? '',
    email: state.email ?? '',
    password: '',
    password_confirm: '',
  });
  // Fields the user typed in (even if emptied again) and fields whose errors are shown.
  const [dirty, setDirty] = useState<Set<FieldName>>(new Set());
  const [shown, setShown] = useState<Set<FieldName>>(new Set());
  const formRef = useRef<HTMLFormElement>(null);

  // After a server response React resets the form: passwords are empty again, name/email kept.
  useEffect(() => {
    setValues((v) => ({
      ...v,
      name: state.name ?? v.name,
      email: state.email ?? v.email,
      password: '',
      password_confirm: '',
    }));
    setDirty(new Set());
    setShown(new Set());
  }, [state]);

  const errors = validate(values);
  const errorFor = (f: FieldName) => (shown.has(f) ? errors[f] : undefined);

  function onBlur(f: FieldName) {
    // Only after the user typed something: a field they never touched stays quiet.
    if (dirty.has(f)) setShown((s) => new Set(s).add(f));
    // Changing the password re-checks an already-typed confirmation.
    if (f === 'password' && dirty.has('password_confirm')) {
      setShown((s) => new Set(s).add('password_confirm'));
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const invalid = FIELDS.map((f) => f.name).filter((f) => errors[f]);
    if (invalid.length > 0) {
      event.preventDefault();
      setShown(new Set(FIELDS.map((f) => f.name)));
      formRef.current?.querySelector<HTMLInputElement>(`[name="${invalid[0]}"]`)?.focus();
    }
  }

  const matches =
    shown.has('password_confirm') && values.password_confirm !== '' && !errors.password_confirm;

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} noValidate className="space-y-4">
      <ClientContextFields />
      {FIELDS.map((f) => {
        const error = errorFor(f.name);
        const id = `signup-${f.name}`;
        return (
          <div key={f.name}>
            <label htmlFor={id} className={labelClass}>
              {f.label}
            </label>
            <input
              id={id}
              name={f.name}
              type={f.type}
              autoComplete={f.autoComplete}
              maxLength={f.maxLength}
              value={values[f.name]}
              onChange={(e) => {
                setValues((v) => ({ ...v, [f.name]: e.target.value }));
                setDirty((d) => (d.has(f.name) ? d : new Set(d).add(f.name)));
              }}
              onBlur={() => onBlur(f.name)}
              aria-invalid={error ? true : undefined}
              aria-describedby={`${id}-hint`}
              className={cn(
                inputClass,
                error &&
                  'border-red-600 focus:border-red-600 focus:ring-red-600/30 dark:border-red-400',
              )}
            />
            <p id={`${id}-hint`} aria-live="polite" className="mt-1 min-h-4 text-xs">
              {error ? (
                <span className="text-red-700 dark:text-red-400">{error}</span>
              ) : f.name === 'password_confirm' && matches ? (
                <span className="text-emerald-700 dark:text-emerald-400">✓ Passwords match</span>
              ) : null}
            </p>
          </div>
        );
      })}
      {state.error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Creating…' : 'Create account'}
      </Button>
      <p className="text-xs text-ink/60 dark:text-paper/60">{note}</p>
    </form>
  );
}

'use client';

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  removeSelectedUsersAction,
  removeUserAction,
  type RemoveState,
} from '../(panel)/users/remove-actions';

const REASONS = {
  owner: 'the owner account cannot be removed',
  self: 'you cannot remove your own account here',
  missing: 'already removed',
  plugins: 'an app could not delete its data; try again later',
} as const;

const dangerButton =
  'rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50';
const plainButton =
  'rounded-md border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5 dark:border-paper/20 dark:hover:bg-paper/10';
const field =
  'mt-1 block w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm text-ink dark:border-paper/20 dark:bg-paper/5 dark:text-paper';

function Warning({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-900 dark:bg-red-950/40 dark:text-red-200">
      {children}
    </div>
  );
}

/**
 * Submits without React's automatic form reset (it would untick the selection after a
 * mistyped confirmation, so the retry would send nobody).
 */
function submitKeepingInputs(action: (form: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  };
}

const whatGoes = (
  <ul className="mt-1 list-disc space-y-1 pl-5">
    <li>The account, profile, picture, sign-in history, subscriptions and messages.</li>
    <li>Everything they created in the apps (shared content stays, without their name).</li>
    <li>They get an email that their account was removed. This cannot be undone.</li>
  </ul>
);

/**
 * Wraps the users table: rows have checkboxes named "ids"; a bar appears for the selection and
 * "Delete selected" asks for DELETE in a dialog before anything is removed.
 */
export function BulkRemoveForm({ children }: { children: ReactNode }) {
  const [state, action, pending] = useActionState<RemoveState, FormData>(
    removeSelectedUsersAction,
    {},
  );
  const [count, setCount] = useState(0);
  const form = useRef<HTMLFormElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const recount = () =>
    setCount(form.current?.querySelectorAll('input[name="ids"]:checked').length ?? 0);

  // After a run: close the dialog and clear the selection (removed rows disappear anyway).
  useEffect(() => {
    if (!state.report) return;
    dialog.current?.close();
    form.current
      ?.querySelectorAll<HTMLInputElement>('input[name="ids"], input[name="confirm"]')
      .forEach((el) => (el.type === 'checkbox' ? (el.checked = false) : (el.value = '')));
    setCount(0);
  }, [state.report]);

  return (
    <form ref={form} onSubmit={submitKeepingInputs(action)} onChange={recount}>
      {state.report ? (
        <p
          role="status"
          className="mb-3 rounded-md bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          {state.report.removed} {state.report.removed === 1 ? 'account' : 'accounts'} removed.
          {state.report.skipped.length
            ? ` Not removed: ${state.report.skipped.map((s) => `#${s.userId} (${REASONS[s.reason]})`).join(', ')}.`
            : ''}
        </p>
      ) : null}
      <div className="mb-3 flex min-h-10 flex-wrap items-center gap-3 text-sm">
        <span className="text-ink/70 dark:text-paper/70">
          {count ? `${count} selected` : 'Select users to remove them (for example inactive ones).'}
        </span>
        {count ? (
          <button
            type="button"
            className={dangerButton}
            onClick={() => dialog.current?.showModal()}
          >
            Delete selected…
          </button>
        ) : null}
      </div>
      {children}
      <dialog
        ref={dialog}
        aria-label="Delete selected users"
        className="m-auto w-[30rem] max-w-[92vw] rounded-xl bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink/60 dark:bg-ink dark:text-paper"
      >
        <div className="space-y-4 p-5">
          <h2 className="font-display text-xl font-bold">
            Delete {count} {count === 1 ? 'account' : 'accounts'}?
          </h2>
          <Warning>
            <p className="font-semibold">Everything about these users is deleted:</p>
            {whatGoes}
          </Warning>
          <label className="block text-sm">
            Type <strong>DELETE</strong> to confirm
            <input name="confirm" autoComplete="off" className={field} />
          </label>
          {state.error ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {state.error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button type="button" className={plainButton} onClick={() => dialog.current?.close()}>
              Cancel
            </button>
            <button type="submit" disabled={pending} className={dangerButton}>
              {pending ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        </div>
      </dialog>
    </form>
  );
}

/** "Delete this account" on the user page; the owner types the user's email to confirm. */
export function RemoveUserPanel({
  userId,
  email,
  name,
}: {
  userId: number;
  email: string;
  name: string;
}) {
  const [state, action, pending] = useActionState<RemoveState, FormData>(
    removeUserAction.bind(null, userId),
    {},
  );
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <section className="mt-10 rounded-lg border border-red-600/30 p-5">
      <h2 className="font-display text-lg font-bold text-red-800 dark:text-red-300">
        Delete this account
      </h2>
      <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
        For accounts that are no longer used. Removes {name} and all their personal data, like a
        deletion by the user.
      </p>
      <button
        type="button"
        className={`${dangerButton} mt-3`}
        onClick={() => dialog.current?.showModal()}
      >
        Delete account…
      </button>
      <dialog
        ref={dialog}
        aria-label={`Delete ${name}`}
        className="m-auto w-[30rem] max-w-[92vw] rounded-xl bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink/60 dark:bg-ink dark:text-paper"
      >
        <form onSubmit={submitKeepingInputs(action)} className="space-y-4 p-5">
          <h2 className="font-display text-xl font-bold">Delete {name}?</h2>
          <Warning>
            <p className="font-semibold">Everything about this user is deleted:</p>
            {whatGoes}
          </Warning>
          <label className="block text-sm">
            Type <strong>{email}</strong> to confirm
            <input name="confirm" autoComplete="off" className={field} />
          </label>
          {state.error ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {state.error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button type="button" className={plainButton} onClick={() => dialog.current?.close()}>
              Cancel
            </button>
            <button type="submit" disabled={pending} className={dangerButton}>
              {pending ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}

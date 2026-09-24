'use client';

import { useActionState, useRef } from 'react';
import { unsubscribeAction, type UnsubscribeState } from '@/lib/subscription-actions';

/**
 * "Unsubscribe" with a confirmation dialog: unsubscribing removes access to the app AND deletes
 * everything the user created in it, so the user must confirm that explicitly.
 */
export function UnsubscribeButton({
  projectId,
  projectName,
  className,
}: {
  projectId: number;
  projectName: string;
  className: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState<UnsubscribeState, FormData>(
    unsubscribeAction.bind(null, projectId),
    {},
  );

  return (
    <>
      <button type="button" className={className} onClick={() => dialog.current?.showModal()}>
        Unsubscribe
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={`unsubscribe-${projectId}`}
        className="m-auto w-[30rem] max-w-[92vw] rounded-xl bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink/60 dark:bg-ink dark:text-paper"
      >
        <form action={action} className="space-y-4 p-5 text-sm">
          <h2 id={`unsubscribe-${projectId}`} className="font-display text-xl font-bold">
            Unsubscribe from {projectName}?
          </h2>
          <div
            role="alert"
            className="rounded-lg border-l-4 border-red-600 bg-red-50 px-4 py-3 text-red-900 dark:bg-red-950/40 dark:text-red-200"
          >
            <p className="font-semibold">Your data in this app will be deleted.</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>You can no longer open {projectName}.</li>
              <li>
                Everything you created in it is deleted. Things you share with other people stay
                with them, without your name.
              </li>
              <li>This cannot be undone. Subscribing again starts from scratch.</li>
            </ul>
          </div>
          {state.error ? (
            <p role="alert" className="text-red-700 dark:text-red-400">
              {state.error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="rounded-md border border-ink/20 px-4 py-2 hover:bg-ink/5 dark:border-paper/20 dark:hover:bg-paper/10"
            >
              Keep my subscription
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800 disabled:opacity-60"
            >
              {pending ? 'Unsubscribing…' : 'Unsubscribe and delete my data'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

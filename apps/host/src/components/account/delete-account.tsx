'use client';

import { useActionState, useRef, useState } from 'react';
import { rich, useT } from '@devquake/ui';
import { deleteAccountAction, type DeleteState } from '@/lib/account-actions';

/**
 * "Delete my account" with a confirmation dialog: explains what will be removed and requires
 * typing DELETE. The server checks the word again; an owner can only leave when another owner or
 * an admin takes over (the page says who).
 */
export function DeleteAccount({ ownerNote = null }: { ownerNote?: string | null }) {
  const t = useT('account.delete');
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccountAction, {});
  const [word, setWord] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const confirmed = word.trim() === 'DELETE';

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setWord('');
          dialog.current?.showModal();
        }}
        className="rounded-md border border-red-600 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:outline-none dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950"
      >
        {t('button')}
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="delete-title"
        className="m-auto w-[min(92vw,30rem)] rounded-lg border border-ink/15 bg-white p-0 text-ink shadow-xl backdrop:bg-ink/60 dark:border-paper/15 dark:bg-ink dark:text-paper"
      >
        <form action={action} className="space-y-4 p-6">
          <h2 id="delete-title" className="font-display text-2xl tracking-tight">
            {t('dialogTitle')}
          </h2>
          <p className="text-sm">
            {rich(t('dialogIntro'), { strong: <strong>{t('permanently')}</strong> })}
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink/80 dark:text-paper/80">
            <li>{t('items.profile')}</li>
            <li>{t('items.subscriptions')}</li>
            <li>{t('items.history')}</li>
            <li>{t('items.messages')}</li>
            <li>{t('items.apps')}</li>
          </ul>
          {ownerNote ? (
            <p className="rounded-md bg-quake/10 px-3 py-2 text-sm font-medium">{ownerNote}</p>
          ) : null}
          <p className="text-sm">{t('signedOut')}</p>
          <div>
            <label htmlFor="delete-confirm" className="mb-1 block text-sm font-medium">
              {rich(t('typeToConfirm'), { word: <strong>DELETE</strong> })}
            </label>
            <input
              id="delete-confirm"
              name="confirm"
              autoComplete="off"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="block w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm focus:border-red-600 focus:ring-2 focus:ring-red-600/30 focus:outline-none dark:border-paper/20 dark:bg-paper/5"
            />
          </div>
          {state.error && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {state.error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="rounded-md border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5 dark:border-paper/20 dark:hover:bg-paper/10"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!confirmed || pending}
              className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? t('deleting') : t('confirm')}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

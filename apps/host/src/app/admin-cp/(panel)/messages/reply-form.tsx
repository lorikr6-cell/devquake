'use client';

import { startTransition, useActionState, useEffect, useState, type FormEvent } from 'react';
import { Button } from '@devquake/ui';
import { replyAction, type ReplyState } from './actions';

/** Reply box under a message: the text stays on an error and clears once sent. */
export function ReplyForm({ messageId, member }: { messageId: number; member: boolean }) {
  const [state, action, pending] = useActionState<ReplyState, FormData>(
    replyAction.bind(null, messageId),
    {},
  );
  const [body, setBody] = useState('');
  useEffect(() => {
    if (state.sent) setBody('');
  }, [state]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData();
    data.set('body', body);
    startTransition(() => action(data));
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-2">
      <label htmlFor={`reply-${messageId}`} className="sr-only">
        Reply
      </label>
      <textarea
        id={`reply-${messageId}`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={5000}
        required
        placeholder="Write a reply…"
        className="block w-full rounded-md border border-ink/20 bg-paper px-3 py-2 text-sm dark:border-paper/20 dark:bg-ink"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || !body.trim()}>
          {pending ? 'Sending…' : 'Send reply'}
        </Button>
        <span className="text-xs text-ink/60 dark:text-paper/60">
          {member
            ? 'Emailed to the sender and shown on their account.'
            : 'Emailed to the sender (they wrote without an account).'}
        </span>
        {state.sent && !pending ? (
          <span role="status" className="text-sm text-emerald-800 dark:text-emerald-300">
            {state.emailed ? 'Reply sent.' : 'Reply saved, but the email could not be sent.'}
          </span>
        ) : null}
        {state.error ? (
          <span role="alert" className="text-sm text-red-700 dark:text-red-400">
            {state.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}

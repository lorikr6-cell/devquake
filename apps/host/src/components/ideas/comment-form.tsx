'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Button, useT } from '@devquake/ui';
import { inputClass } from '@/components/form-styles';
import { commentAction, type CommentState } from '@/lib/community-actions';

export function CommentForm({ ideaId }: { ideaId: number }) {
  const [state, action, pending] = useActionState<CommentState, FormData>(
    commentAction.bind(null, ideaId),
    {},
  );
  const t = useT('ideas.comment');
  const text = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (state.posted && text.current) text.current.value = '';
  }, [state.posted]);
  return (
    <form action={action} className="space-y-2">
      <label htmlFor="comment-body" className="sr-only">
        {t('label')}
      </label>
      <textarea
        ref={text}
        id="comment-body"
        name="body"
        rows={3}
        maxLength={2000}
        required
        placeholder={t('placeholder')}
        className={inputClass}
      />
      {state.error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? t('posting') : t('post')}
      </Button>
    </form>
  );
}

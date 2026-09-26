'use client';

import { useState } from 'react';
import { Button, useT } from '@devquake/ui';
import type { Question } from '../lib/model';
import { callApi } from './call-api';
import { OpenEntry } from './open-entry';
import { ReleaseForm, type Person, type ReleaseDraft } from './release';
import { ErrorText } from './ui';
import { useAction } from './use-action';

/** The owner's page: open (and edit) the entry, and set who receives it. */
export function OwnerWorkspace({
  entryId,
  questions,
  locked,
  released,
  people,
  release,
  hostUrl,
  titles,
}: {
  entryId: number;
  questions: Question[];
  locked: string | null;
  released: boolean;
  people: Person[];
  release: ReleaseDraft;
  hostUrl: string;
  titles: { open: string; release: string };
}) {
  const [knownKey, setKnownKey] = useState<string | null>(null);
  return (
    <>
      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">{titles.open}</h2>
        <OpenEntry
          entryId={entryId}
          questions={questions}
          isOwner
          locked={locked}
          onOpened={setKnownKey}
        />
      </section>
      {!released ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold">{titles.release}</h2>
          <ReleaseForm
            entryId={entryId}
            people={people}
            initial={release}
            hostUrl={hostUrl}
            knownKey={knownKey}
          />
        </section>
      ) : null}
    </>
  );
}

export function UnlockButton({ entryId }: { entryId: number }) {
  const t = useT('attempts');
  const { busy, error, act } = useAction();
  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        type="button"
        disabled={busy}
        onClick={() => {
          if (confirm(t('unlockConfirm'))) act(() => callApi(`/entries/${entryId}/unlock`, 'POST'));
        }}
      >
        {t('unlock')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}

export function DeleteEntryButton({ entryId, title }: { entryId: number; title: string }) {
  const t = useT('entry');
  const { busy, error, act, router } = useAction();
  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        type="button"
        variant="secondary"
        disabled={busy}
        className="text-red-700 dark:text-red-400"
        onClick={() => {
          if (!confirm(t('deleteConfirm', { title }))) return;
          act(
            () => callApi(`/entries/${entryId}`, 'DELETE'),
            () => router.push('/'),
          );
        }}
      >
        {t('delete')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}

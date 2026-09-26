'use client';

import { useState, type FormEvent } from 'react';
import { Button, trackEvent, useT } from '@devquake/ui';
import { decryptContent, encryptContent, fromBase64, toBase64 } from '../lib/crypto';
import {
  answersSecret,
  normalizeAnswer,
  parseVaultKey,
  type Question,
  type VaultContent,
} from '../lib/model';
import { callApi, errorMessage } from './call-api';
import { ContentEditor, ContentView } from './content';
import { AnswerInput, type AnswerValue } from './questions';
import { ErrorText, Field, Input } from './ui';
import { useAppRouter } from './use-app-router';

/**
 * Opening an entry: the vault key and the three answers. The server checks them (and counts the
 * try); the content is decrypted here, in the browser. The owner can then change it; it is
 * encrypted again with the same key and answers.
 */
export function OpenEntry({
  entryId,
  questions,
  isOwner,
  locked,
  onOpened,
}: {
  entryId: number;
  questions: Question[];
  isOwner: boolean;
  /** Locked until (ISO), or null. */
  locked: string | null;
  /** The key that opened it (the owner's page reuses it for the release settings). */
  onOpened?: (vaultKey: string) => void;
}) {
  const t = useT('open');
  const tErr = useT('errors');
  const router = useAppRouter();
  const [key, setKey] = useState('');
  const [answers, setAnswers] = useState<AnswerValue[]>(() =>
    questions.map((q) => (q.type === 'multi' ? [] : q.type === 'single' ? null : '')),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [content, setContent] = useState<VaultContent | null>(null);
  const [editing, setEditing] = useState<VaultContent | null>(null);
  const [saved, setSaved] = useState(false);

  const secret = () => {
    const normalized = questions.map((q, i) => normalizeAnswer(q, answers[i]));
    return normalized.every((n) => n !== null) ? answersSecret(normalized as string[]) : null;
  };

  async function open(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await callApi<{ salt: string; iv: string; ciphertext: string }>(
        `/open/${entryId}/attempt`,
        'POST',
        { vaultKey: key, answers },
      );
      const keyBytes = parseVaultKey(key);
      const s = secret();
      if (!res || !keyBytes || s === null) throw new Error(t('failed'));
      const plain = await decryptContent(
        {
          salt: fromBase64(res.salt),
          iv: fromBase64(res.iv),
          ciphertext: fromBase64(res.ciphertext),
        },
        keyBytes,
        s,
      );
      setContent(plain);
      onOpened?.(key);
      trackEvent('vault_entry_opened', { owner: isOwner ? 1 : 0 });
    } catch (err) {
      setError(errorMessage(err, tErr));
      // A lock or a counted failure changes the page (lock notice, tries list).
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    setError('');
    try {
      const keyBytes = parseVaultKey(key);
      const s = secret();
      if (!keyBytes || s === null) throw new Error(t('failed'));
      const sealed = await encryptContent(editing, keyBytes, s);
      await callApi(`/entries/${entryId}/content`, 'PUT', {
        vaultKey: key,
        answers,
        salt: toBase64(sealed.salt),
        iv: toBase64(sealed.iv),
        ciphertext: toBase64(sealed.ciphertext),
      });
      setContent(editing);
      setEditing(null);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, tErr));
    } finally {
      setBusy(false);
    }
  }

  if (content) {
    return (
      <div className="space-y-4">
        {editing ? (
          <>
            <ContentEditor value={editing} onChange={setEditing} />
            <ErrorText>{error}</ErrorText>
            <div className="flex gap-2">
              <Button type="button" onClick={() => void saveEdit()} disabled={busy}>
                {busy ? t('saving') : t('saveChanges')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditing(null)}
                disabled={busy}
              >
                {t('cancel')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <ContentView content={content} />
            {saved ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-400">{t('saved')}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {isOwner ? (
                <Button type="button" variant="secondary" onClick={() => setEditing(content)}>
                  {t('edit')}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setContent(null);
                  setEditing(null);
                  setKey('');
                }}
              >
                {t('close')}
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (locked) {
    return (
      <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm">
        🔒 {isOwner ? t('lockedOwner') : t('locked')}
      </p>
    );
  }

  return (
    <form onSubmit={open} className="space-y-4">
      <Field label={t('vaultKey')} hint={t('vaultKeyHint')}>
        <Input
          required
          value={key}
          autoComplete="off"
          spellCheck={false}
          className="font-mono uppercase"
          placeholder="XXXX-XXXX-XXXX-…"
          onChange={(e) => setKey(e.target.value)}
        />
      </Field>
      {questions.map((q, i) => (
        <div key={i}>
          <label htmlFor={`answer-${i}`} className="mb-1 block text-sm font-medium">
            {i + 1}. {q.prompt}
          </label>
          <AnswerInput
            id={`answer-${i}`}
            question={q}
            value={answers[i] ?? null}
            onChange={(v) => setAnswers(answers.map((a, j) => (j === i ? v : a)))}
          />
        </div>
      ))}
      <p className="text-xs text-ink/60 dark:text-paper/60">{t('attemptsNote')}</p>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy}>
        {busy ? t('opening') : t('open')}
      </Button>
    </form>
  );
}

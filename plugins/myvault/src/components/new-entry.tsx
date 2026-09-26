'use client';

import { useMemo, useState } from 'react';
import { Button, cn, trackEvent, useT } from '@devquake/ui';
import { encryptContent, keyCheck, randomBytes, toBase64 } from '../lib/crypto';
import {
  CATEGORIES,
  MAX_CONTENT_BYTES,
  QUESTIONS_PER_ENTRY,
  VAULT_KEY_BYTES,
  answersSecret,
  formatVaultKey,
  normalizeAnswer,
  type VaultContent,
} from '../lib/model';
import { callApi, errorMessage } from './call-api';
import { ContentEditor, contentSize, emptyContent } from './content';
import { QuestionEditor, emptyQuestion, toQuestion, type QuestionDraft } from './questions';
import { ReleaseFields, emptyRelease, releaseBody, type Person } from './release';
import { ErrorText, Field, Input, Panel, Select } from './ui';
import { useAppRouter } from './use-app-router';

const STEPS = ['content', 'questions', 'key', 'release'] as const;
type Step = (typeof STEPS)[number];

/**
 * A new entry in four steps: what it holds, the three questions (with the right answers), the
 * vault key (made here, shown once, never stored in readable form) and who may receive it. The
 * content is encrypted here, in the browser, before anything is sent.
 */
export function NewEntry({ people, hostUrl }: { people: Person[]; hostUrl: string }) {
  const t = useT('wizard');
  const tCat = useT('categories');
  const tErr = useT('errors');
  const router = useAppRouter();
  const [step, setStep] = useState<Step>('content');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('note');
  const [content, setContent] = useState<VaultContent>(emptyContent);
  const [drafts, setDrafts] = useState<QuestionDraft[]>(() =>
    Array.from({ length: QUESTIONS_PER_ENTRY }, emptyQuestion),
  );
  const key = useMemo(() => randomBytes(VAULT_KEY_BYTES), []);
  const keyText = useMemo(() => formatVaultKey(key), [key]);
  const [keySaved, setKeySaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [release, setRelease] = useState(emptyRelease);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const questions = drafts.map(toQuestion);
  const answers = drafts.map((d, i) => normalizeAnswer(questions[i]!, d.answer));

  function check(of: Step): string {
    if (of === 'content') {
      if (!title.trim()) return t('needTitle');
      if (contentSize(content) > MAX_CONTENT_BYTES) return t('tooLarge');
      if (!content.note.trim() && content.secrets.length === 0 && content.files.length === 0)
        return t('needContent');
    }
    if (of === 'questions') {
      for (const [i, q] of questions.entries()) {
        if (!q.prompt) return t('needPrompt', { n: i + 1 });
        if (q.options && (q.options.length < 2 || q.options.length > 12))
          return t('needOptions', { n: i + 1 });
        if (answers[i] === null) return t('needAnswer', { n: i + 1 });
      }
    }
    if (of === 'key' && !keySaved) return t('needKeySaved');
    return '';
  }

  function go(next: Step) {
    const problem = check(step);
    if (STEPS.indexOf(next) > STEPS.indexOf(step) && problem) {
      setError(problem);
      return;
    }
    setError('');
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function download() {
    const text = `${t('keyFileTitle', { title })}\n\n${keyText}\n\n${t('keyFileNote')}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `vault-key-${title.replace(/[^\w-]+/g, '-').slice(0, 40) || 'entry'}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function save() {
    setBusy(true);
    setError('');
    try {
      const secret = answersSecret(answers as string[]);
      const sealed = await encryptContent(content, key, secret);
      const res = await callApi<{ id: number }>('/entries', 'POST', {
        title: title.trim(),
        category,
        questions,
        answers: drafts.map((d) => d.answer),
        keyCheck: await keyCheck(key),
        salt: toBase64(sealed.salt),
        iv: toBase64(sealed.iv),
        ciphertext: toBase64(sealed.ciphertext),
      });
      const id = res!.id;
      if (release.recipients.length) {
        await callApi(`/entries/${id}/release`, 'PUT', {
          ...releaseBody(release),
          vaultKey: keyText,
        });
      }
      trackEvent('vault_entry_created', { recipients: release.recipients.length ? 1 : 0 });
      router.push(`/entries/${id}`);
    } catch (err) {
      setError(errorMessage(err, tErr));
      setBusy(false);
    }
  }

  const index = STEPS.indexOf(step);
  return (
    <div className="space-y-5">
      <ol className="flex flex-wrap gap-2 text-sm" aria-label={t('steps')}>
        {STEPS.map((s, i) => (
          <li
            key={s}
            aria-current={s === step ? 'step' : undefined}
            className={cn(
              'rounded-full px-3 py-1',
              s === step
                ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                : i < index
                  ? 'bg-quake/15'
                  : 'bg-ink/5 dark:bg-paper/10',
            )}
          >
            {i + 1}. {t(`step.${s}`)}
          </li>
        ))}
      </ol>

      <Panel className="space-y-5">
        {step === 'content' ? (
          <>
            <p className="text-sm text-ink/70 dark:text-paper/70">{t('contentIntro')}</p>
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
              <Field label={t('title')} hint={t('titleHint')}>
                <Input
                  required
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Field>
              <Field label={t('category')}>
                <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.icon} {tCat(c.code)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <ContentEditor value={content} onChange={setContent} />
          </>
        ) : step === 'questions' ? (
          <>
            <p className="text-sm text-ink/70 dark:text-paper/70">{t('questionsIntro')}</p>
            {drafts.map((d, i) => (
              <QuestionEditor
                key={i}
                n={i + 1}
                value={d}
                onChange={(next) => setDrafts(drafts.map((x, j) => (j === i ? next : x)))}
              />
            ))}
          </>
        ) : step === 'key' ? (
          <>
            <p className="text-sm text-ink/70 dark:text-paper/70">{t('keyIntro')}</p>
            <p className="rounded-lg bg-ink px-4 py-3 text-center font-mono text-base tracking-wider break-all text-paper select-all sm:text-lg dark:bg-paper dark:text-ink">
              {keyText}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  await navigator.clipboard.writeText(keyText).catch(() => undefined);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? t('copied') : t('copyKey')}
              </Button>
              <Button type="button" variant="secondary" onClick={download}>
                {t('downloadKey')}
              </Button>
            </div>
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              ⚠ {t('keyWarning')}
            </p>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-quake"
                checked={keySaved}
                onChange={(e) => setKeySaved(e.target.checked)}
              />
              {t('keySaved')}
            </label>
          </>
        ) : (
          <>
            <p className="text-sm text-ink/70 dark:text-paper/70">{t('releaseIntro')}</p>
            <ReleaseFields
              people={people}
              value={release}
              onChange={setRelease}
              hostUrl={hostUrl}
            />
          </>
        )}
      </Panel>

      <ErrorText>{error}</ErrorText>
      <div className="flex flex-wrap justify-between gap-2">
        {index > 0 ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => go(STEPS[index - 1]!)}
            disabled={busy}
          >
            {t('back')}
          </Button>
        ) : (
          <span />
        )}
        {step === 'release' ? (
          <Button type="button" onClick={() => void save()} disabled={busy}>
            {busy ? t('saving') : t('save')}
          </Button>
        ) : (
          <Button type="button" onClick={() => go(STEPS[index + 1]!)}>
            {t('next')}
          </Button>
        )}
      </div>
    </div>
  );
}

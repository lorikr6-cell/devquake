'use client';

import { useState } from 'react';
import { Button, useT } from '@devquake/ui';
import { fromBase64, toBase64 } from '../lib/crypto';
import { MAX_CONTENT_BYTES, MAX_FILES, type VaultContent } from '../lib/model';
import { ErrorText, Field, Input, TextArea } from './ui';

export const emptyContent = (): VaultContent => ({ v: 1, note: '', secrets: [], files: [] });

/** How big the content is once encrypted (roughly: the JSON text). */
export function contentSize(content: VaultContent): number {
  return new TextEncoder().encode(JSON.stringify(content)).length;
}

const formatBytes = (n: number) =>
  n < 1024
    ? `${n} B`
    : n < 1024 * 1024
      ? `${Math.round(n / 1024)} KB`
      : `${(n / 1024 / 1024).toFixed(1)} MB`;

/** Writing an entry: a note, secret fields (label and value) and files. */
export function ContentEditor({
  value,
  onChange,
}: {
  value: VaultContent;
  onChange: (content: VaultContent) => void;
}) {
  const t = useT('editor');
  const [error, setError] = useState('');
  const size = contentSize(value);

  async function addFiles(list: FileList | null) {
    setError('');
    if (!list) return;
    const files = [...value.files];
    for (const file of Array.from(list)) {
      if (files.length >= MAX_FILES) {
        setError(t('tooManyFiles', { max: MAX_FILES }));
        break;
      }
      const data = toBase64(new Uint8Array(await file.arrayBuffer()));
      files.push({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        data,
      });
    }
    const next = { ...value, files };
    if (contentSize(next) > MAX_CONTENT_BYTES) {
      setError(t('tooLarge', { max: formatBytes(MAX_CONTENT_BYTES) }));
      return;
    }
    onChange(next);
  }

  return (
    <div className="space-y-5">
      <Field label={t('note')} hint={t('noteHint')}>
        <TextArea
          value={value.note}
          onChange={(e) => onChange({ ...value, note: e.target.value })}
          className="min-h-40 font-mono text-sm"
        />
      </Field>

      <div className="space-y-2">
        <p className="text-sm font-medium">{t('secrets')}</p>
        <p className="text-xs text-ink/60 dark:text-paper/60">{t('secretsHint')}</p>
        {value.secrets.map((s, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]">
            <Input
              aria-label={t('label')}
              placeholder={t('labelPlaceholder')}
              value={s.label}
              maxLength={100}
              onChange={(e) => {
                const secrets = value.secrets.map((x, j) =>
                  j === i ? { ...x, label: e.target.value } : x,
                );
                onChange({ ...value, secrets });
              }}
            />
            <Input
              aria-label={t('value')}
              placeholder={t('valuePlaceholder')}
              value={s.value}
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              onChange={(e) => {
                const secrets = value.secrets.map((x, j) =>
                  j === i ? { ...x, value: e.target.value } : x,
                );
                onChange({ ...value, secrets });
              }}
            />
            <Button
              type="button"
              variant="ghost"
              aria-label={t('removeSecret', { label: s.label || String(i + 1) })}
              onClick={() =>
                onChange({ ...value, secrets: value.secrets.filter((_, j) => j !== i) })
              }
            >
              ✕
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            onChange({ ...value, secrets: [...value.secrets, { label: '', value: '' }] })
          }
        >
          {t('addSecret')}
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">{t('files')}</p>
        <p className="text-xs text-ink/60 dark:text-paper/60">
          {t('filesHint', { max: formatBytes(MAX_CONTENT_BYTES), count: MAX_FILES })}
        </p>
        {value.files.length ? (
          <ul className="divide-y divide-ink/10 rounded-md border border-ink/10 text-sm dark:divide-paper/10 dark:border-paper/10">
            {value.files.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="min-w-0 truncate">
                  📎 {f.name}{' '}
                  <span className="text-xs text-ink/50 dark:text-paper/50">
                    {formatBytes(f.size)}
                  </span>
                </span>
                <button
                  type="button"
                  className="text-xs text-red-700 underline dark:text-red-400"
                  onClick={() =>
                    onChange({ ...value, files: value.files.filter((_, j) => j !== i) })
                  }
                >
                  {t('removeFile')}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-ink/20 px-3 text-sm font-medium hover:bg-ink/5 dark:border-paper/20 dark:hover:bg-paper/10">
          {t('addFiles')}
          <input
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
        <p className="text-xs text-ink/50 dark:text-paper/50">
          {t('size', { size: formatBytes(size), max: formatBytes(MAX_CONTENT_BYTES) })}
        </p>
        <ErrorText>{error}</ErrorText>
      </div>
    </div>
  );
}

/** A decrypted entry: the note, the secret fields (hidden until shown) and the files. */
export function ContentView({ content }: { content: VaultContent }) {
  const t = useT('editor');
  const [shown, setShown] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState<number | null>(null);

  function download(i: number) {
    const f = content.files[i]!;
    const blob = new Blob([fromBase64(f.data).slice().buffer as ArrayBuffer], { type: f.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = f.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="space-y-5">
      {content.note ? (
        <div>
          <p className="mb-1 text-sm font-medium">{t('note')}</p>
          <pre className="rounded-lg bg-ink/5 p-3 text-sm whitespace-pre-wrap break-words dark:bg-paper/10">
            {content.note}
          </pre>
        </div>
      ) : null}
      {content.secrets.length ? (
        <div>
          <p className="mb-1 text-sm font-medium">{t('secrets')}</p>
          <ul className="divide-y divide-ink/10 rounded-lg border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
            {content.secrets.map((s, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span className="font-medium">{s.label}</span>
                <span className="flex items-center gap-2">
                  <code className="rounded bg-ink/5 px-2 py-0.5 font-mono dark:bg-paper/10">
                    {shown.has(i) ? s.value : '••••••••'}
                  </code>
                  <button
                    type="button"
                    className="text-xs underline"
                    onClick={() => {
                      const next = new Set(shown);
                      if (next.has(i)) next.delete(i);
                      else next.add(i);
                      setShown(next);
                    }}
                  >
                    {shown.has(i) ? t('hide') : t('show')}
                  </button>
                  <button
                    type="button"
                    className="text-xs underline"
                    onClick={async () => {
                      await navigator.clipboard.writeText(s.value).catch(() => undefined);
                      setCopied(i);
                      setTimeout(() => setCopied(null), 1500);
                    }}
                  >
                    {copied === i ? t('copied') : t('copy')}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {content.files.length ? (
        <div>
          <p className="mb-1 text-sm font-medium">{t('files')}</p>
          <ul className="space-y-1 text-sm">
            {content.files.map((f, i) => (
              <li key={i}>
                <button type="button" className="text-quake underline" onClick={() => download(i)}>
                  📎 {f.name}
                </button>{' '}
                <span className="text-xs text-ink/50 dark:text-paper/50">
                  {formatBytes(f.size)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {!content.note && !content.secrets.length && !content.files.length ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('empty')}</p>
      ) : null}
    </div>
  );
}

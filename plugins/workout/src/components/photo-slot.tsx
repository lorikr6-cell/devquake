'use client';

import { useRef, useState } from 'react';
import { cn, shrinkPhoto, useT, type Translate } from '@devquake/ui';
import { PHOTO_MAX_SIDE, photoUrl, type PhotoKind } from '../lib/photos';
import { callApi, errorMessage } from './call-api';
import { ErrorText } from './ui';
import { useAppRouter } from './use-app-router';

/**
 * Shrinks a photo in the browser and uploads it for a period (ADR 0015). Errors carry a text
 * in the page language; `te` is useT('errors').
 */
export async function uploadProgressPhoto(
  kind: PhotoKind,
  period: string,
  file: File,
  te: Translate,
): Promise<number> {
  const blob = await shrinkPhoto(file, PHOTO_MAX_SIDE, 0.85).catch(() => {
    throw new Error(te('photoPrepare'));
  });
  const res = await fetch(`/api/photos/${kind}/${period}`, {
    method: 'PUT',
    headers: { 'Content-Type': blob.type },
    body: blob,
  });
  const data = (await res.json().catch(() => null)) as { id?: number; error?: string } | null;
  if (!res.ok) throw new Error(data?.error || te('generic', { status: res.status }));
  return data?.id ?? 0;
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

/**
 * One progress photo: shows it, or offers to take one with the camera or pick one from the
 * phone; it can be replaced or deleted. Private: only the person can load it.
 */
export function PhotoSlot({
  kind,
  period,
  photo,
  title,
  className,
}: {
  kind: PhotoKind;
  /** "current" (start), "2026-09" (month) or "2026" (year). */
  period: string;
  photo: { id: number; version: string } | null;
  title: string;
  className?: string;
}) {
  const t = useT('photos');
  const te = useT('errors');
  const router = useAppRouter();
  const camera = useRef<HTMLInputElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      await uploadProgressPhoto(kind, period, file, te);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, te));
    } finally {
      setBusy(false);
      if (camera.current) camera.current.value = '';
      if (picker.current) picker.current.value = '';
    }
  };

  const remove = async () => {
    if (!photo || !window.confirm(t('deleteConfirm'))) return;
    setBusy(true);
    try {
      await callApi(`/photos/${photo.id}`, 'DELETE');
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, te));
    } finally {
      setBusy(false);
    }
  };

  const small =
    'min-h-11 flex-1 rounded-md border border-ink/15 px-2 text-sm font-medium dark:border-paper/20 disabled:opacity-50';

  return (
    <div className={cn('rounded-xl border border-ink/10 p-3 dark:border-paper/10', className)}>
      <p className="mb-2 text-sm font-semibold">{title}</p>
      {photo ? (
        // A plain <img>: the photo comes from the app's own API, only for its owner.
        <img
          src={photoUrl(photo.id, photo.version)}
          alt={title}
          className="aspect-[3/4] w-full rounded-lg bg-ink/5 object-cover dark:bg-paper/10"
        />
      ) : (
        <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink/15 p-4 text-center text-sm text-ink/60 dark:border-paper/20 dark:text-paper/60">
          <CameraIcon className="size-10" />
          {t('empty')}
        </div>
      )}
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="user"
        hidden
        onChange={(e) => void upload(e.target.files?.[0])}
      />
      <input
        ref={picker}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => void upload(e.target.files?.[0])}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className={small}
          disabled={busy}
          onClick={() => camera.current?.click()}
        >
          {t('take')}
        </button>
        <button
          type="button"
          className={small}
          disabled={busy}
          onClick={() => picker.current?.click()}
        >
          {photo ? t('replace') : t('upload')}
        </button>
        {photo ? (
          <button
            type="button"
            className={cn(small, 'flex-none text-red-700 dark:text-red-400')}
            disabled={busy}
            onClick={() => void remove()}
            aria-label={t('delete')}
          >
            ✕
          </button>
        ) : null}
      </div>
      {busy ? <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{t('saving')}</p> : null}
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

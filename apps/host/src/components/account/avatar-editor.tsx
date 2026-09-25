'use client';

import { startTransition, useActionState, useRef, useState } from 'react';
import { useT } from '@devquake/ui';
import { removeAvatarAction, uploadAvatarAction, type AvatarState } from '@/lib/account-actions';

const SIZE = 256;

/** Center-crops and scales an image to SIZE x SIZE in the browser (WebP, PNG fallback). */
async function resize(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  );
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('resize failed'))), 'image/webp', 0.86),
  );
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join('') || '?'
  );
}

/** Profile picture with "Change" / "Remove". Shows initials when there is no picture. */
export function AvatarEditor({
  userId,
  name,
  version,
}: {
  userId: number;
  name: string;
  /** Timestamp of the current picture, or null when there is none. */
  version: number | null;
}) {
  const t = useT('account.avatar');
  const [state, upload, uploading] = useActionState<AvatarState, FormData>(uploadAvatarAction, {});
  const [localError, setLocalError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setLocalError(null);
    if (!/^image\//.test(file.type)) {
      setLocalError(t('wrongType'));
      return;
    }
    try {
      const blob = await resize(file);
      const form = new FormData();
      form.append('avatar', new File([blob], 'avatar', { type: blob.type }));
      startTransition(() => upload(form));
    } catch {
      setLocalError(t('unreadable'));
    } finally {
      if (input.current) input.current.value = '';
    }
  }

  const error = localError ?? state.error;
  return (
    <div className="flex items-center gap-4">
      {version ? (
        // Private, per-user image served by /avatar/<id>: plain <img> on purpose.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/avatar/${userId}?v=${version}`}
          alt=""
          width={72}
          height={72}
          className="size-18 rounded-full object-cover ring-2 ring-quake/40"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-18 place-items-center rounded-full bg-ink font-display text-2xl text-paper dark:bg-paper dark:text-ink"
        >
          {initials(name)}
        </span>
      )}
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-md border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-quake dark:border-paper/20 dark:hover:bg-paper/10">
            {uploading ? t('uploading') : version ? t('change') : t('upload')}
            <input
              ref={input}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => onPick(e.target.files?.[0])}
            />
          </label>
          {version && (
            <form action={removeAvatarAction}>
              <button
                type="submit"
                className="rounded-md px-3 py-1.5 text-sm text-ink/70 hover:bg-ink/5 dark:text-paper/70 dark:hover:bg-paper/10"
              >
                {t('remove')}
              </button>
            </form>
          )}
        </div>
        <p aria-live="polite" className="text-xs">
          {error ? (
            <span className="text-red-700 dark:text-red-400">{error}</span>
          ) : (
            <span className="text-ink/60 dark:text-paper/60">{t('hint')}</span>
          )}
        </p>
      </div>
    </div>
  );
}

'use client';

import { shrinkPhoto, type Translate } from '@devquake/ui';
import { callApi } from './call-api';

/** Shrinks and uploads a product photo (replaces the previous one); `t` is useT('errors'). */
export async function uploadPhoto(
  listId: number,
  itemId: number,
  file: File,
  t: Translate,
): Promise<void> {
  const blob = await shrinkPhoto(file).catch(() => {
    throw new Error(t('photoPrepare'));
  });
  const res = await fetch(`/api/lists/${listId}/items/${itemId}/photo`, {
    method: 'PUT',
    headers: { 'Content-Type': blob.type },
    body: blob,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? t('photoSave', { status: res.status }));
  }
}

export function removePhoto(listId: number, itemId: number) {
  return callApi(`/lists/${listId}/items/${itemId}/photo`, 'DELETE');
}

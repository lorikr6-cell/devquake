'use client';

import { shrinkPhoto } from '@devquake/ui';
import { callApi } from './call-api';

/** Shrinks and uploads a product photo (replaces the previous one). */
export async function uploadPhoto(listId: number, itemId: number, file: File): Promise<void> {
  const blob = await shrinkPhoto(file);
  const res = await fetch(`/api/lists/${listId}/items/${itemId}/photo`, {
    method: 'PUT',
    headers: { 'Content-Type': blob.type },
    body: blob,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `The photo could not be saved (${res.status})`);
  }
}

export function removePhoto(listId: number, itemId: number) {
  return callApi(`/lists/${listId}/items/${itemId}/photo`, 'DELETE');
}

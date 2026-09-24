'use client';

import { callApi } from './call-api';

const MAX_SIDE = 1280;
const QUALITY = 0.82;

/**
 * Shrinks a photo in the browser before uploading (phone photos are often 3-8 MB): at most
 * 1280 px on the longest side, JPEG. The image is drawn upright (EXIF orientation applied).
 */
export async function shrinkPhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Choose a photo (JPEG, PNG or WebP).');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('This photo could not be read. Try a JPEG or PNG.');
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot prepare photos.');
  context.fillStyle = '#FFFFFF'; // transparent PNGs get a white background in JPEG
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY),
  );
  if (!blob) throw new Error('This photo could not be prepared.');
  return blob;
}

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

// Product photos: which files are accepted (checked by content, not by the file name).

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export type PhotoMime = 'image/jpeg' | 'image/png' | 'image/webp';

/** The image type from the first bytes, or null for anything that is not JPEG, PNG or WebP. */
export function sniffPhoto(bytes: Uint8Array): PhotoMime | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a
  ) {
    return 'image/png';
  }
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  return null;
}

/** Address of an item's photo; `version` changes when the photo does (browser cache). */
export function photoUrl(listId: number, itemId: number, version: number): string {
  return `/api/lists/${listId}/items/${itemId}/photo?v=${version}`;
}

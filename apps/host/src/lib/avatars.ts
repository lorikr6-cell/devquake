import 'server-only';
import { execute, queryOne, type Row } from './db';

/**
 * Profile pictures, stored in the database (Hostinger replaces app files on every deploy). The
 * browser resizes them to 256x256 before upload; the server only accepts small PNG/JPEG/WebP
 * files and checks their real content, not just the declared type.
 */
export const MAX_AVATAR_BYTES = 512 * 1024;

export function sniffImageType(
  bytes: Uint8Array,
): 'image/png' | 'image/jpeg' | 'image/webp' | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png';
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return 'image/jpeg';
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

export async function saveAvatar(userId: number, bytes: Uint8Array, mime: string): Promise<void> {
  await execute(
    `INSERT INTO user_avatars (user_id, mime, data) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE mime = VALUES(mime), data = VALUES(data), updated_at = UTC_TIMESTAMP()`,
    [userId, mime, Buffer.from(bytes)],
  );
}

export async function removeAvatar(userId: number): Promise<void> {
  await execute('DELETE FROM user_avatars WHERE user_id = ?', [userId]);
}

export async function getAvatar(userId: number) {
  return queryOne<Row & { mime: string; data: Buffer; updated_at: Date }>(
    'SELECT mime, data, updated_at FROM user_avatars WHERE user_id = ?',
    [userId],
  );
}

/** Cache-busting version for <img src>, or null when the user has no avatar. */
export async function avatarVersion(userId: number): Promise<number | null> {
  const row = await queryOne<Row & { updated_at: Date }>(
    'SELECT updated_at FROM user_avatars WHERE user_id = ?',
    [userId],
  );
  return row ? row.updated_at.getTime() : null;
}

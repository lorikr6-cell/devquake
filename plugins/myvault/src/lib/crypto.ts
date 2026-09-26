// Encryption of vault entries with the Web Crypto API (the browser; Node has the same API, so it
// is tested as it runs). The content key is derived with HKDF-SHA-256 from the vault key
// (32 random bytes) and the three normalised answers, and the content is encrypted with
// AES-256-GCM. Neither the key nor the answers alone open an entry.

import type { VaultContent } from './model';

const subtle = () => globalThis.crypto.subtle;
const encoder = new TextEncoder();
const INFO = 'devquake-vault-v1';

/** A copy as a plain ArrayBuffer (what Web Crypto accepts everywhere). */
const buf = (bytes: Uint8Array) => bytes.slice().buffer as ArrayBuffer;

export function randomBytes(length: number): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(length));
}

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function fromBase64(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** SHA-256 of the vault key (hex): the server checks a typed key against it. */
export async function keyCheck(key: Uint8Array): Promise<string> {
  const data = new Uint8Array([...encoder.encode(`${INFO}:check:`), ...key]);
  const hash = new Uint8Array(await subtle().digest('SHA-256', buf(data)));
  return [...hash].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function contentKey(key: Uint8Array, salt: Uint8Array, secret: string): Promise<CryptoKey> {
  const base = await subtle().importKey('raw', buf(key), 'HKDF', false, ['deriveKey']);
  return subtle().deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: buf(salt),
      info: buf(encoder.encode(`${INFO}\u0000${secret}`)),
    },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export interface Sealed {
  salt: Uint8Array;
  iv: Uint8Array;
  ciphertext: Uint8Array;
}

/** Encrypts an entry's content with the vault key and the answers' secret (model.answersSecret). */
export async function encryptContent(
  content: VaultContent,
  key: Uint8Array,
  secret: string,
): Promise<Sealed> {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const cryptoKey = await contentKey(key, salt, secret);
  const plain = encoder.encode(JSON.stringify(content));
  const ciphertext = new Uint8Array(
    await subtle().encrypt({ name: 'AES-GCM', iv: buf(iv) }, cryptoKey, buf(plain)),
  );
  return { salt, iv, ciphertext };
}

/** Decrypts an entry; throws when the key or the answers are wrong (AES-GCM checks it). */
export async function decryptContent(
  sealed: Sealed,
  key: Uint8Array,
  secret: string,
): Promise<VaultContent> {
  const cryptoKey = await contentKey(key, sealed.salt, secret);
  const plain = await subtle().decrypt(
    { name: 'AES-GCM', iv: buf(sealed.iv) },
    cryptoKey,
    buf(sealed.ciphertext),
  );
  return JSON.parse(new TextDecoder().decode(plain)) as VaultContent;
}

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from 'node:crypto';

// Server only. The answers are checked against a slow hash (scrypt), so a stolen database does
// not give them away cheaply; the vault key (for recipients) and the answers of failed tries
// (for the owner's review) are sealed with the master key from MYVAULT_MASTER_KEY (32 bytes,
// base64). Without the master key the app does not run.

const SCRYPT = { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function hashAnswers(secret: string, salt: Uint8Array): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(secret.normalize('NFC'), Buffer.from(salt), 32, SCRYPT, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

export async function answersMatch(
  secret: string,
  salt: Uint8Array,
  expected: Uint8Array,
): Promise<boolean> {
  const actual = await hashAnswers(secret, salt);
  return actual.length === expected.length && timingSafeEqual(actual, Buffer.from(expected));
}

export function newSalt(): Buffer {
  return randomBytes(16);
}

/** The master key, or null when MYVAULT_MASTER_KEY is missing or not 32 bytes. */
export function masterKey(): Buffer | null {
  const raw = process.env.MYVAULT_MASTER_KEY;
  if (!raw) return null;
  try {
    const key = Buffer.from(raw, 'base64');
    return key.length === 32 ? key : null;
  } catch {
    return null;
  }
}

function requireMasterKey(): Buffer {
  const key = masterKey();
  if (!key) throw new Error('MYVAULT_MASTER_KEY is missing or not 32 bytes (base64)');
  return key;
}

/** AES-256-GCM with the master key: version byte, nonce (12), tag (16), ciphertext. */
export function seal(plain: Uint8Array): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', requireMasterKey(), iv);
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([Buffer.from([1]), iv, cipher.getAuthTag(), body]);
}

export function unseal(sealed: Uint8Array): Buffer {
  const data = Buffer.from(sealed);
  if (data[0] !== 1) throw new Error('unknown sealed format');
  const decipher = createDecipheriv('aes-256-gcm', requireMasterKey(), data.subarray(1, 13));
  decipher.setAuthTag(data.subarray(13, 29));
  return Buffer.concat([decipher.update(data.subarray(29)), decipher.final()]);
}

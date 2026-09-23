import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

export const CODE_LENGTH = 6;

/** A uniformly random numeric code, e.g. "048213" (leading zeros kept). */
export function generateCode(): string {
  return String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, '0');
}

/** Random token kept only in the browser's HttpOnly challenge cookie. */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * The stored value for a code. Binding it to the browser token means the database alone is
 * not enough to brute-force codes offline, and a code only works in the browser that asked.
 */
export function codeHash(token: string, code: string): string {
  return sha256(`${token}:${code}`);
}

/** Normalises what the user typed ("123 456", "123-456") to digits only. */
export function normaliseCode(input: string): string | null {
  const digits = input.replace(/[\s-]/g, '');
  return new RegExp(`^\\d{${CODE_LENGTH}}$`).test(digits) ? digits : null;
}

export function hashesEqual(a: string, b: string): boolean {
  const x = Buffer.from(a, 'hex');
  const y = Buffer.from(b, 'hex');
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

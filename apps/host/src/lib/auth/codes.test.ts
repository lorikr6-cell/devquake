import { describe, expect, it } from 'vitest';
import { codeHash, generateCode, generateToken, hashesEqual, normaliseCode } from './codes';

describe('verification codes', () => {
  it('generates 6-digit codes, keeping leading zeros', () => {
    for (let i = 0; i < 200; i++) expect(generateCode()).toMatch(/^\d{6}$/);
  });

  it('binds the stored hash to the browser token', () => {
    const token = generateToken();
    const hash = codeHash(token, '123456');
    expect(hashesEqual(hash, codeHash(token, '123456'))).toBe(true);
    expect(hashesEqual(hash, codeHash(token, '123457'))).toBe(false);
    expect(hashesEqual(hash, codeHash(generateToken(), '123456'))).toBe(false);
  });

  it('normalises typed input', () => {
    expect(normaliseCode(' 123 456 ')).toBe('123456');
    expect(normaliseCode('123-456')).toBe('123456');
    expect(normaliseCode('12345')).toBeNull();
    expect(normaliseCode('12345a')).toBeNull();
  });

  it('compares hashes safely', () => {
    expect(hashesEqual('', '')).toBe(false);
    expect(hashesEqual('ab', 'abcd')).toBe(false);
  });
});

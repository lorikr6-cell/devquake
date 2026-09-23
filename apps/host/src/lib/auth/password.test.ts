import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('produces the documented scrypt format with a random salt', async () => {
    const a = await hashPassword('correct horse battery staple');
    const b = await hashPassword('correct horse battery staple');
    expect(a).toMatch(/^scrypt\$32768\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(a).not.toBe(b);
  });

  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('s3cret-Passw0rd!');
    expect(await verifyPassword('s3cret-Passw0rd!', hash)).toBe(true);
    expect(await verifyPassword('s3cret-passw0rd!', hash)).toBe(false);
  });

  it('rejects malformed hashes instead of throwing', async () => {
    expect(await verifyPassword('x', '')).toBe(false);
    expect(await verifyPassword('x', 'bcrypt$abc')).toBe(false);
    expect(await verifyPassword('x', 'scrypt$32768$8$1$c2FsdA==$')).toBe(false);
  });
});

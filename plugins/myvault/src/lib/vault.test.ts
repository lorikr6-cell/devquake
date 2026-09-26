import { describe, expect, it } from 'vitest';
import {
  decryptContent,
  encryptContent,
  fromBase64,
  keyCheck,
  randomBytes,
  toBase64,
} from './crypto';
import {
  answersSecret,
  formatVaultKey,
  normalizeAnswer,
  parseVaultKey,
  releaseState,
  type Question,
  type VaultContent,
} from './model';
import { answersMatch, hashAnswers, newSalt, seal, unseal } from './server-crypto';

const q = (type: Question['type'], options: string[] | null = null): Question => ({
  prompt: '?',
  type,
  options,
});

describe('vault key', () => {
  it('is written as 13 groups of 4 and read back, forgiving typos people make', () => {
    const key = randomBytes(32);
    const text = formatVaultKey(key);
    expect(text).toMatch(/^([0-9A-Z]{4}-){12}[0-9A-Z]{4}$/);
    expect(parseVaultKey(text)).toEqual(key);
    expect(parseVaultKey(text.toLowerCase().replace(/-/g, ' '))).toEqual(key);
    const withO = text.replace(/0/g, 'O');
    expect(parseVaultKey(withO)).toEqual(key);
    expect(parseVaultKey('ABCD')).toBeNull();
    expect(parseVaultKey(text.replace(/.$/, 'U'))).toBeNull();
  });
});

describe('answers', () => {
  it('normalises every type so honest answers match', () => {
    expect(normalizeAnswer(q('date'), '1984-02-29')).toBe('1984-02-29');
    expect(normalizeAnswer(q('date'), '1985-02-29')).toBeNull();
    expect(normalizeAnswer(q('text'), '  Érdi   ANNA ')).toBe('erdi anna');
    expect(normalizeAnswer(q('text'), '   ')).toBeNull();
    expect(normalizeAnswer(q('number'), '007')).toBe('7');
    expect(normalizeAnswer(q('number'), '2,50')).toBe('2.5');
    expect(normalizeAnswer(q('number'), '12a')).toBeNull();
    const pets = q('single', ['Cat', 'Dog', 'Fish']);
    expect(normalizeAnswer(pets, 1)).toBe('1');
    expect(normalizeAnswer(pets, 3)).toBeNull();
    const colours = q('multi', ['Red', 'Green', 'Blue']);
    expect(normalizeAnswer(colours, [2, 0])).toBe('0,2');
    expect(normalizeAnswer(colours, [])).toBeNull();
    expect(normalizeAnswer(colours, [0, 5])).toBeNull();
  });
});

describe('encryption', () => {
  const content: VaultContent = {
    v: 1,
    note: 'The safe code is under the stairs.',
    secrets: [{ label: 'Bank PIN', value: '4821' }],
    files: [
      {
        name: 'will.pdf',
        type: 'application/pdf',
        size: 3,
        data: toBase64(new Uint8Array([1, 2, 3])),
      },
    ],
  };

  it('opens only with the right key AND the right answers', async () => {
    const key = randomBytes(32);
    const secret = answersSecret(['1984-02-29', 'erdi anna', '7']);
    const sealed = await encryptContent(content, key, secret);
    expect(await decryptContent(sealed, key, secret)).toEqual(content);
    await expect(decryptContent(sealed, randomBytes(32), secret)).rejects.toThrow();
    await expect(
      decryptContent(sealed, key, answersSecret(['1984-02-29', 'erdi anna', '8'])),
    ).rejects.toThrow();
    expect(fromBase64(toBase64(sealed.ciphertext))).toEqual(sealed.ciphertext);
  });

  it('checks the key without revealing it', async () => {
    const key = randomBytes(32);
    expect(await keyCheck(key)).toMatch(/^[0-9a-f]{64}$/);
    expect(await keyCheck(key)).toBe(await keyCheck(key.slice()));
    expect(await keyCheck(key)).not.toBe(await keyCheck(randomBytes(32)));
  });
});

describe('server checks', () => {
  it('compares answers with a slow hash', async () => {
    const salt = newSalt();
    const hash = await hashAnswers('a\u001fb\u001fc', salt);
    expect(await answersMatch('a\u001fb\u001fc', salt, hash)).toBe(true);
    expect(await answersMatch('a\u001fb\u001fd', salt, hash)).toBe(false);
  });

  it('seals with the master key', () => {
    process.env.MYVAULT_MASTER_KEY = Buffer.alloc(32, 7).toString('base64');
    const sealed = seal(new Uint8Array([9, 8, 7]));
    expect([...unseal(sealed)]).toEqual([9, 8, 7]);
    sealed[sealed.length - 1]! ^= 1;
    expect(() => unseal(sealed)).toThrow();
  });
});

describe('release rule', () => {
  const now = new Date('2026-10-20T12:00:00Z');
  const base = {
    hasRecipients: true,
    inactiveDays: 30,
    notBefore: null,
    ruleSetAt: '2026-01-01T00:00:00Z',
    now,
  };

  it('stays private without recipients', () => {
    expect(releaseState({ ...base, hasRecipients: false, lastActiveAt: null })).toEqual({
      kind: 'private',
    });
  });

  it('waits, warns and releases by inactivity', () => {
    expect(releaseState({ ...base, lastActiveAt: '2026-10-10T12:00:00Z' }).kind).toBe('waiting');
    expect(releaseState({ ...base, lastActiveAt: '2026-09-25T12:00:00Z' })).toEqual({
      kind: 'warn',
      releaseAt: '2026-10-25T12:00:00.000Z',
      daysLeft: 5,
    });
    expect(releaseState({ ...base, lastActiveAt: '2026-09-01T00:00:00Z' }).kind).toBe('release');
  });

  it('never counts from before the rule was set, and waits for the date', () => {
    expect(
      releaseState({
        ...base,
        ruleSetAt: '2026-10-19T00:00:00Z',
        lastActiveAt: '2025-01-01T00:00:00Z',
      }).kind,
    ).toBe('waiting');
    expect(
      releaseState({ ...base, notBefore: '2027-01-01', lastActiveAt: '2026-01-01T00:00:00Z' }).kind,
    ).toBe('waiting');
  });
});

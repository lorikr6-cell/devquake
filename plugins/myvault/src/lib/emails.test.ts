import { describe, expect, it } from 'vitest';
import { lockEmail, releaseEmail, warningEmail } from './emails';
import { formatVaultKey } from './model';

describe('vault emails', () => {
  const key = new Uint8Array(32).fill(7);

  it('sends the recipient the key and the link to the entry, in their language', () => {
    const en = releaseEmail(
      { entryId: 9, title: 'For the family', ownerName: 'Ana', key },
      'en',
      'https://myvault.devquake.com',
    );
    expect(en.subject).toBe('Ana left you a vault entry');
    expect(en.rows).toContainEqual(['Vault key', formatVaultKey(key)]);
    expect(en.button?.url).toBe('https://myvault.devquake.com/open/9');
    const hu = releaseEmail({ entryId: 9, title: 'x', ownerName: 'Ana', key }, 'hu', 'https://v');
    expect(hu.button?.url).toBe('https://v/hu/open/9');
  });

  it('warns the owner in days and tells them how to postpone', () => {
    const one = warningEmail({ title: 'Seeds', daysLeft: 1 }, 'en', 'https://v');
    expect(one.paragraphs[0]).toContain('about 1 day,');
    const ro = warningEmail({ title: 'Seeds', daysLeft: 5 }, 'ro', 'https://v');
    expect(ro.paragraphs[0]).toContain('5 zile');
    expect(ro.button?.url).toBe('https://v/ro');
  });

  it('tells the owner about a lock with a link to review the tries', () => {
    const de = lockEmail({ entryId: 3, title: 'PINs' }, 'de', 'https://v');
    expect(de.paragraphs[0]).toContain('36 Stunden');
    expect(de.button?.url).toBe('https://v/de/entries/3');
  });
});

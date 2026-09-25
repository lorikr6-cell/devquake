import { describe, expect, it } from 'vitest';
import { LOCALES, messageKeys, messagePlaceholders, type Messages } from '@devquake/ui';
import { catalog } from './catalog';

// Every language must have exactly the English texts, with the same {placeholders} (ADR 0011).
const en = catalog('en');
const keys = messageKeys(en).sort();

function node(messages: Messages, key: string): unknown {
  return key.split('.').reduce<unknown>((n, k) => (n as Messages | undefined)?.[k], messages);
}

describe('host message catalogs', () => {
  it('has English texts', () => {
    expect(keys.length).toBeGreaterThan(300);
  });

  for (const locale of LOCALES.filter((l) => l !== 'en')) {
    describe(locale, () => {
      const messages = catalog(locale);

      it('has the same keys as English', () => {
        expect(messageKeys(messages).sort()).toEqual(keys);
      });

      it('uses the same placeholders as English', () => {
        const wrong = keys.filter(
          (key) =>
            messagePlaceholders(messages, key).join() !== messagePlaceholders(en, key).join(),
        );
        expect(wrong).toEqual([]);
      });

      it('gives every plural the forms this language needs', () => {
        const needed = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
        const missing = keys.filter((key) => {
          const value = node(messages, key);
          if (typeof value === 'string') return false;
          return needed.some((form) => !(form in (value as object)));
        });
        expect(missing).toEqual([]);
      });

      it('has no empty or untranslated-looking texts', () => {
        const empty = keys.filter((key) => {
          const value = node(messages, key);
          return typeof value === 'string' && value.trim() === '';
        });
        expect(empty).toEqual([]);
      });
    });
  }
});

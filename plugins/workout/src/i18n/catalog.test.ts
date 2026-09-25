import { describe, expect, it } from 'vitest';
import { LOCALES, messageKeys, messagePlaceholders, type Messages } from '@devquake/ui';
import { SAMPLE_WEEK } from '../lib/sample';
import { appMessages } from './index';

// Every language must have exactly the English texts, with the same {placeholders} (ADR 0011).
const en = appMessages('en');
const keys = messageKeys(en).sort();

function node(messages: Messages, key: string): unknown {
  return key.split('.').reduce<unknown>((n, k) => (n as Messages | undefined)?.[k], messages);
}

describe('workout message catalogs', () => {
  it('names every sample workout and exercise', () => {
    for (const workout of SAMPLE_WEEK) {
      expect(typeof node(en, `sample.workouts.${workout.key}`)).toBe('string');
      for (const e of workout.exercises) {
        expect(typeof node(en, `sample.exercises.${e.exercise}`)).toBe('string');
      }
    }
  });

  for (const locale of LOCALES.filter((l) => l !== 'en')) {
    describe(locale, () => {
      const messages = appMessages(locale);

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

      it('has no empty texts', () => {
        const empty = keys.filter((key) => {
          const value = node(messages, key);
          return typeof value === 'string' && value.trim() === '';
        });
        expect(empty).toEqual([]);
      });
    });
  }
});

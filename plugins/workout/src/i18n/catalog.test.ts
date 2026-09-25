import { describe, expect, it } from 'vitest';
import { LOCALES, messageKeys, messagePlaceholders, type Messages } from '@devquake/ui';
import { EQUIPMENT, EXERCISES, LOCATIONS, MUSCLES } from '../lib/catalog';
import { STRENGTH_TEMPLATE_KEYS } from '../lib/generator';
import { EXPERIENCES, GOALS } from '../lib/model';
import { appMessages } from './index';
import { MANUAL, type ManualBlock } from './manual';

// Every language must have exactly the English texts, with the same {placeholders} (ADR 0011).
const en = appMessages('en');
const keys = messageKeys(en).sort();

function node(messages: Messages, key: string): unknown {
  return key.split('.').reduce<unknown>((n, k) => (n as Messages | undefined)?.[k], messages);
}

const blockShape = (b: ManualBlock) =>
  'steps' in b
    ? `steps:${b.steps.length}`
    : 'list' in b
      ? `list:${b.list.length}`
      : Object.keys(b)[0];

describe('workout message catalogs', () => {
  it('names and explains every exercise, and names all equipment and muscle groups', () => {
    for (const e of EXERCISES) {
      expect(typeof node(en, `exercises.${e.slug}.name`), e.slug).toBe('string');
      expect(typeof node(en, `exercises.${e.slug}.howTo`), e.slug).toBe('string');
    }
    for (const q of EQUIPMENT)
      expect(typeof node(en, `equipment.${q.slug}`), q.slug).toBe('string');
    for (const m of MUSCLES) expect(typeof node(en, `muscles.${m}`), m).toBe('string');
  });

  it('has no texts for exercises that are not in the catalogue', () => {
    const slugs = new Set(EXERCISES.map((e) => e.slug));
    for (const key of Object.keys(node(en, 'exercises') as Messages)) {
      expect(slugs.has(key), key).toBe(true);
    }
  });

  it('names every place, routine template, experience level and goal', () => {
    for (const l of LOCATIONS) expect(typeof node(en, `locations.${l}.name`)).toBe('string');
    for (const k of [...STRENGTH_TEMPLATE_KEYS, 'walk', 'intervals', 'park']) {
      expect(typeof node(en, `templates.${k}`), k).toBe('string');
    }
    for (const x of EXPERIENCES) expect(typeof node(en, `experience.${x}.label`)).toBe('string');
    for (const g of GOALS) expect(typeof node(en, `goals.${g}.label`)).toBe('string');
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

      it('gives every plural the forms this language needs', () => {
        const needed = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
        const missing = keys.filter((key) => {
          const value = node(messages, key);
          if (typeof value === 'string') return false;
          return needed.some((form) => !(form in (value as object)));
        });
        expect(missing).toEqual([]);
      });

      it('has the manual with the same sections and blocks as English', () => {
        const shape = (m: typeof MANUAL.en) =>
          m.sections.map((s) => `${s.id}:${s.blocks.map(blockShape).join(',')}`);
        expect(shape(MANUAL[locale])).toEqual(shape(MANUAL.en));
        expect(MANUAL[locale].cta).toContain('{link}');
        expect(MANUAL[locale].questions).toContain('{email}');
        const count = (m: typeof MANUAL.en, token: string) => JSON.stringify(m).split(token).length;
        expect(count(MANUAL[locale], '{host}')).toBe(count(MANUAL.en, '{host}'));
        expect(count(MANUAL[locale], '**')).toBe(count(MANUAL.en, '**'));
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

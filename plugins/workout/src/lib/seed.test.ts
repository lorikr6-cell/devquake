import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { autoMotion, autoProp, generatedIcon } from '../illustrations/auto';
import { EQUIPMENT_ICONS, equipmentIcon } from '../illustrations/icons';
import { MOTIONS } from '../illustrations/motions';
import { EQUIPMENT, EXERCISES } from './catalog';
import { SEED_MIGRATION, seedSql } from './seed-sql';

const file = new URL(`../../db/migrations/${SEED_MIGRATION}.sql`, import.meta.url);

describe('catalogue', () => {
  it('has unique exercise slugs that fit the database', () => {
    const slugs = EXERCISES.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z][a-z0-9_]{1,47}$/);
  });

  it('gives every exercise an animation and every piece of equipment an icon', () => {
    for (const e of EXERCISES) expect(MOTIONS[e.motion], e.slug).toBeDefined();
    for (const q of EQUIPMENT)
      expect(EQUIPMENT_ICONS[q.slug]).toMatch(/^<svg [^>]*viewBox="0 0 24 24"/);
  });

  it('only uses equipment from the list, and distance exercises have a speed', () => {
    const known = new Set<string>(EQUIPMENT.map((q) => q.slug));
    for (const e of EXERCISES) {
      for (const q of e.equipment) expect(known.has(q), `${e.slug}: ${q}`).toBe(true);
      if (e.metric === 'distance') expect(e.speed, e.slug).toBeGreaterThan(0);
      expect(e.places.length, e.slug).toBeGreaterThan(0);
    }
  });

  it('illustrates a new exercise automatically from its pattern and equipment', () => {
    const pattern = (
      p: string,
      equipment: string[] = [],
      metric: 'reps' | 'time' | 'distance' = 'reps',
    ) => autoMotion({ pattern: p, metric, equipment });
    expect(pattern('push_h')).toBe('push_up');
    expect(pattern('push_h', ['dumbbells', 'bench'])).toBe('bench_press');
    expect(pattern('squat', ['barbell', 'squat_rack'])).toBe('back_squat');
    expect(pattern('pull_v', ['pull_up_bar'])).toBe('pull_up');
    expect(pattern('core', [], 'time')).toBe('plank');
    expect(pattern('cardio', [], 'distance')).toBe('run');
    expect(pattern('something_new')).toBe('march');
    expect(autoProp(['kettlebell'])).toBe('kettlebell');
    // Every pattern of the catalogue has an animation that exists.
    for (const e of EXERCISES) expect(MOTIONS[autoMotion(e)], e.slug).toBeDefined();
  });

  it('gives new equipment a generated icon', () => {
    expect(equipmentIcon('foam_roller')).toBe(generatedIcon('foam_roller'));
    expect(generatedIcon('foam_roller')).toContain('>FR</text>');
    expect(generatedIcon('<x>')).not.toContain('<x>');
    expect(equipmentIcon('dumbbells')).toBe(EQUIPMENT_ICONS.dumbbells);
  });

  it('has icons without scripts or event handlers', () => {
    for (const icon of EQUIPMENT.map((q) => equipmentIcon(q.slug)))
      expect(icon).not.toMatch(/<script|\son\w+=|javascript:/i);
  });
});

describe('seed migration', () => {
  it(`db/migrations/${SEED_MIGRATION}.sql matches the catalogue`, () => {
    const expected = seedSql();
    if (process.env.UPDATE_SEED) writeFileSync(file, expected);
    expect(readFileSync(file, 'utf8').replace(/\r\n/g, '\n')).toBe(expected);
  });
});

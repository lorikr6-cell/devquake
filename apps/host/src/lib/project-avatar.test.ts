import { describe, expect, it } from 'vitest';
import {
  AUTO_COLORS,
  autoColor,
  autoSymbol,
  contrastRatio,
  isHexColor,
  projectAvatarLook,
  projectInitials,
  textColorOn,
} from './project-avatar';

describe('projectInitials', () => {
  it('takes the first letter of up to three words', () => {
    expect(projectInitials('Shared shopping lists')).toBe('SSL');
    expect(projectInitials('One two three four five')).toBe('OTT');
  });

  it('splits camelCase, skips small words and keeps two letters of a single word', () => {
    expect(projectInitials('DevQuake')).toBe('DQ');
    expect(projectInitials('Bills and receipts')).toBe('BR');
    expect(projectInitials('darts')).toBe('Da');
    expect(projectInitials('The')).toBe('Th');
  });

  it('handles accents, digits, punctuation and empty names', () => {
    expect(projectInitials('școală de șoferi')).toBe('ȘȘ');
    expect(projectInitials('2048 game')).toBe('2G');
    expect(projectInitials('work-life / balance')).toBe('WLB');
    expect(projectInitials('to-do / habits')).toBe('DH'); // "to" is a small word
    expect(projectInitials('  ')).toBe('?');
  });
});

describe('automatic look', () => {
  it('keeps the same colour for a project and uses the palette', () => {
    expect(autoColor('shopping')).toBe(autoColor('Shopping'));
    expect(AUTO_COLORS).toContain(autoColor('darts'));
  });

  it('guesses a symbol from the name, app id or description', () => {
    expect(autoSymbol('Shared shopping lists', 'shopping')).toBe('cart');
    expect(autoSymbol('Facturi și utilități')).toBe('receipt');
    expect(autoSymbol('Darts scorer')).toBe('target');
    expect(autoSymbol('Something', null, 'Plan family recipes')).toBe('utensils');
    expect(autoSymbol('Zzz')).toBe('sparkles');
  });

  it('prefers a chosen colour and symbol, ignoring invalid ones', () => {
    const chosen = projectAvatarLook({ name: 'Darts', color: '#ffcc00', symbol: 'star' });
    expect(chosen).toMatchObject({ background: '#FFCC00', symbol: 'star', foreground: '#16181D' });
    const invalid = projectAvatarLook({ name: 'Darts', color: 'red', symbol: 'nope' });
    expect(invalid.background).toBe(invalid.autoColor);
    expect(invalid.symbol).toBe('target');
  });

  it('picks readable text colours', () => {
    expect(textColorOn('#16181D')).toBe('#FFFFFF');
    expect(textColorOn('#F4F1EA')).toBe('#16181D');
    for (const c of AUTO_COLORS) {
      expect(textColorOn(c)).toBe('#FFFFFF');
      expect(contrastRatio(c, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    }
    expect(isHexColor('#12abEF')).toBe(true);
    expect(isHexColor('#12abE')).toBe(false);
  });
});

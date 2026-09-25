import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME,
  baseMode,
  cleanThemeName,
  contrastRatio,
  hexToHsv,
  hsvToHex,
  parseThemeSettings,
  themeCss,
} from './custom-theme';

describe('parseThemeSettings', () => {
  it('accepts valid colours and fonts, from JSON or an object', () => {
    const settings = {
      colors: { background: '#ffffff', text: '#111111', accent: '#e4572e' },
      fonts: { h1: 'lora', p: 'inter', body: '' },
    };
    expect(parseThemeSettings(JSON.stringify(settings))).toEqual({
      colors: { background: '#FFFFFF', text: '#111111', accent: '#E4572E' },
      fonts: { h1: 'lora', p: 'inter' },
    });
  });

  it('rejects anything that could reach the CSS unchecked', () => {
    const colors = { background: '#ffffff', text: '#111111', accent: '#e4572e' };
    expect(parseThemeSettings({ colors: { ...colors, text: 'red;}body{x' } })).toBeNull();
    expect(parseThemeSettings({ colors, fonts: { h1: 'Comic Sans' } })).toBeNull();
    expect(parseThemeSettings({ colors, fonts: { script: 'inter' } })).toBeNull();
    expect(parseThemeSettings('{not json')).toBeNull();
    expect(parseThemeSettings(null)).toBeNull();
  });
});

describe('themeCss', () => {
  it('maps a light theme onto Paper and Ink', () => {
    const css = themeCss(DEFAULT_THEME);
    expect(baseMode(DEFAULT_THEME)).toBe('light');
    expect(css).toContain('--dq-paper:#F4F1EA;--dq-ink:#16181D;--dq-quake:#E4572E');
    expect(css).toContain('color-scheme:light');
  });

  it('swaps the tokens for a dark background, as the dark mode uses them', () => {
    const dark = {
      colors: { background: '#101020', text: '#F0F0F0', accent: '#44AAFF' },
      fonts: {},
    };
    expect(baseMode(dark)).toBe('dark');
    expect(themeCss(dark)).toContain('--dq-paper:#F0F0F0;--dq-ink:#101020');
  });

  it('writes one rule per chosen element font', () => {
    const css = themeCss({ ...DEFAULT_THEME, fonts: { h1: 'lora', input: 'mono' } });
    expect(css).toContain(
      ":root[data-custom-theme] h1{font-family:'Lora Variable', Georgia, serif}",
    );
    expect(css).toContain(
      ':root[data-custom-theme] input,:root[data-custom-theme] textarea,:root[data-custom-theme] select{',
    );
    expect(css).not.toContain(' h2{');
  });
});

describe('colours', () => {
  it('converts between hex and HSV', () => {
    for (const hex of ['#E4572E', '#16181D', '#FFFFFF', '#000000', '#2A62CC']) {
      const { h, s, v } = hexToHsv(hex);
      expect(hsvToHex(h, s, v)).toBe(hex);
    }
  });

  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#16181D', '#F4F1EA')).toBeGreaterThan(4.5);
  });

  it('cleans theme names', () => {
    expect(cleanThemeName('  My   theme ')).toBe('My theme');
    expect(cleanThemeName('   ')).toBeNull();
    expect(cleanThemeName('x'.repeat(100))).toHaveLength(60);
  });
});

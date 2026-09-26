import { describe, expect, it } from 'vitest';
import { NEURAL_VOICES, cleanSpokenText, prosody, ssml, voiceLabel } from './tts';

describe('natural coach voices', () => {
  it('has an adult male and female neural voice in every language', () => {
    for (const v of Object.values(NEURAL_VOICES)) {
      expect(v.male).toMatch(/^[a-z]{2}-[A-Z]{2}-\w+Neural$/);
      expect(v.female).toMatch(/^[a-z]{2}-[A-Z]{2}-\w+Neural$/);
      expect(v.male).not.toBe(v.female);
    }
    expect(voiceLabel('ro', 'male')).toBe('Emil');
    expect(voiceLabel('hu', 'female')).toBe('Noemi');
  });

  it('makes the male voice crisp, except the drill sergeant', () => {
    expect(prosody('normal', 'male')).toEqual({ rate: '+5%', pitch: '+3%' });
    expect(prosody('normal', 'female')).toEqual({ rate: '+0%', pitch: '+0%' });
    expect(prosody('crazyMale', 'male')).toEqual({ rate: '+14%', pitch: '-6%' });
    expect(prosody('calm', 'male')).toEqual({ rate: '-3%', pitch: '+1%' });
  });

  it('builds safe SSML', () => {
    const x = ssml('Push-ups <10> & "go"', 'de', 'male', 'normal');
    expect(x).toContain('<voice name="de-DE-ConradNeural">');
    expect(x).toContain('xml:lang="de-DE"');
    expect(x).toContain('Push-ups &lt;10&gt; &amp; &quot;go&quot;');
  });

  it('accepts one short line of text only', () => {
    expect(cleanSpokenText('  Ready?\n  Go!  ')).toBe('Ready? Go!');
    expect(cleanSpokenText('')).toBeNull();
    expect(cleanSpokenText('x'.repeat(301))).toBeNull();
    expect(cleanSpokenText(5)).toBeNull();
  });
});

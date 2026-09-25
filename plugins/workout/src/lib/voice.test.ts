import { describe, expect, it } from 'vitest';
import {
  motivationKey,
  parseVoiceSettings,
  pickVoice,
  voiceGender,
  voiceTextSet,
  voiceTuning,
} from './voice';

const voices = [
  { name: 'Microsoft David - English (United States)', lang: 'en-US' },
  { name: 'Microsoft Zira - English (United States)', lang: 'en-US' },
  { name: 'Google UK English Male', lang: 'en-GB' },
  { name: 'Google Deutsch', lang: 'de-DE' },
  { name: 'Microsoft Katja - German (Germany)', lang: 'de-DE' },
  { name: 'Microsoft Stefan - German (Germany)', lang: 'de-DE' },
  { name: 'Microsoft Andrei - Romanian (Romania)', lang: 'ro-RO' },
];

describe('voice', () => {
  it('guesses the gender from the voice name', () => {
    expect(voiceGender('Microsoft Zira - English')).toBe('female');
    expect(voiceGender('Google UK English Male')).toBe('male');
    expect(voiceGender('Google UK English Female')).toBe('female');
    expect(voiceGender('Google Deutsch')).toBeNull();
  });

  it('picks a voice in the page language and the chosen gender', () => {
    expect(pickVoice(voices, 'de-DE', 'female')!.name).toContain('Katja');
    expect(pickVoice(voices, 'de-DE', 'male')!.name).toContain('Stefan');
    expect(pickVoice(voices, 'en-GB', 'male')!.name).toBe('Google UK English Male');
    expect(pickVoice(voices, 'en-GB', 'female')!.name).toContain('Zira');
  });

  it('uses whatever the language has when the gender is missing, and nothing for no language', () => {
    expect(pickVoice(voices, 'ro-RO', 'female')!.name).toContain('Andrei');
    expect(pickVoice(voices, 'hu-HU', 'female')).toBeNull();
  });

  it('reads stored settings safely', () => {
    expect(parseVoiceSettings(null)).toEqual({ muted: false, gender: 'female', style: 'normal' });
    expect(parseVoiceSettings('{"muted":true,"gender":"male","style":"motivational"}')).toEqual({
      muted: true,
      gender: 'male',
      style: 'motivational',
    });
    expect(parseVoiceSettings('{"gender":"robot"}').gender).toBe('female');
    expect(parseVoiceSettings('not json').style).toBe('normal');
  });

  it('rotates the encouragements', () => {
    expect(new Set([1, 2, 3, 4, 5, 6].map(motivationKey)).size).toBe(6);
  });

  it('has two crazy coaches: a drill sergeant (male) and a bossy boss (female)', () => {
    expect(voiceTextSet({ style: 'crazy', gender: 'male' })).toBe('crazyMale');
    expect(voiceTextSet({ style: 'crazy', gender: 'female' })).toBe('crazyFemale');
    expect(voiceTextSet({ style: 'calm', gender: 'male' })).toBe('calm');
    expect(parseVoiceSettings('{"style":"crazy"}').style).toBe('crazy');
  });

  it('makes a male voice from another one when the device has none', () => {
    const male = { style: 'normal' as const, gender: 'male' as const };
    expect(voiceTuning(male, 'male').pitch).toBe(1);
    expect(voiceTuning(male, 'female').pitch).toBeLessThan(0.6);
    expect(voiceTuning(male, null).pitch).toBeLessThan(0.6);
    expect(voiceTuning({ style: 'normal', gender: 'female' }, 'male').pitch).toBeGreaterThan(1.3);
    expect(voiceTuning({ style: 'normal', gender: 'female' }, null).pitch).toBe(1);
  });
});

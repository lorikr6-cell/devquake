// The coach's natural voices (neural text-to-speech, Microsoft Azure), generated on the server
// and cached as audio (api/voice.ts). Pure: voices, speaking style and the SSML sent to Azure.
// Unit-tested (tts.test.ts). Without WORKOUT_TTS_KEY the app uses the device's voices instead.

import type { PluginLocale } from '@devquake/plugin-sdk';
import type { VoiceGender, VoiceTextSet } from './voice';

/** Adult neural voices with the same clear style in every language. */
export const NEURAL_VOICES: Record<PluginLocale, { lang: string } & Record<VoiceGender, string>> = {
  en: { lang: 'en-GB', male: 'en-GB-RyanNeural', female: 'en-GB-SoniaNeural' },
  de: { lang: 'de-DE', male: 'de-DE-ConradNeural', female: 'de-DE-KatjaNeural' },
  ro: { lang: 'ro-RO', male: 'ro-RO-EmilNeural', female: 'ro-RO-AlinaNeural' },
  hu: { lang: 'hu-HU', male: 'hu-HU-TamasNeural', female: 'hu-HU-NoemiNeural' },
};

/** The names people see in the speech settings ("Emil"). */
export function voiceLabel(locale: PluginLocale, gender: VoiceGender): string {
  return NEURAL_VOICES[locale][gender].split('-')[2]!.replace('Neural', '');
}

/**
 * Speaking rate and pitch per style, in SSML percentages. The male voice is a little faster and
 * brighter than its default ("crisp"), except the drill sergeant, who barks low.
 */
export function prosody(set: VoiceTextSet, gender: VoiceGender): { rate: string; pitch: string } {
  const base: Record<VoiceTextSet, { rate: number; pitch: number }> = {
    calm: { rate: -8, pitch: -2 },
    normal: { rate: 0, pitch: 0 },
    motivational: { rate: 8, pitch: 4 },
    crazyMale: { rate: 14, pitch: -6 },
    crazyFemale: { rate: 12, pitch: 8 },
  };
  const { rate, pitch } = base[set];
  const crisp =
    gender === 'male' && set !== 'crazyMale' ? { rate: 5, pitch: 3 } : { rate: 0, pitch: 0 };
  const pct = (n: number) => `${n >= 0 ? '+' : ''}${n}%`;
  return { rate: pct(rate + crisp.rate), pitch: pct(pitch + crisp.pitch) };
}

/** The longest text spoken at once (a coach sentence); longer ones are refused. */
export const MAX_SPOKEN_CHARS = 300;

/** The text as it is spoken: one line, no control characters, at most MAX_SPOKEN_CHARS. */
export function cleanSpokenText(text: unknown): string | null {
  if (typeof text !== 'string') return null;
  const clean = text
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean && clean.length <= MAX_SPOKEN_CHARS ? clean : null;
}

const escapeXml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export function ssml(
  text: string,
  locale: PluginLocale,
  gender: VoiceGender,
  set: VoiceTextSet,
): string {
  const voice = NEURAL_VOICES[locale];
  const { rate, pitch } = prosody(set, gender);
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${voice.lang}">` +
    `<voice name="${voice[gender]}"><prosody rate="${rate}" pitch="${pitch}">${escapeXml(text)}</prosody></voice>` +
    `</speak>`
  );
}

export const VOICE_TEXT_SETS: VoiceTextSet[] = [
  'calm',
  'normal',
  'motivational',
  'crazyMale',
  'crazyFemale',
];

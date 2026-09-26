import { api } from '../lib/api';
import { HttpError } from '../lib/http';
import { VOICE_TEXT_SETS, cleanSpokenText } from '../lib/tts';
import { voiceClip } from '../lib/tts-server';
import type { VoiceGender, VoiceTextSet } from '../lib/voice';

// GET /api/voice?text=...&gender=male|female&style=normal: one sentence of the voice coach as
// audio (MP3), in the page language, with Azure neural voices (cached in voice_clips). 503 when
// natural voices are not available: the browser then uses the device's own voice.
export const GET = api(async ({ request, db, user, locale }) => {
  const params = new URL(request.url).searchParams;
  const text = cleanSpokenText(params.get('text'));
  const gender = params.get('gender') as VoiceGender;
  const style = params.get('style') as VoiceTextSet;
  if (!text || !['male', 'female'].includes(gender) || !VOICE_TEXT_SETS.includes(style)) {
    throw new HttpError(400, 'invalidRequest');
  }
  const clip = await voiceClip(db, user.id, text, locale, gender, style);
  if (!clip) throw new HttpError(503, 'unavailable');
  return new Response(new Uint8Array(clip.data), {
    headers: {
      'Content-Type': clip.mime,
      // The same sentence always sounds the same: the browser may keep it.
      'Cache-Control': 'private, max-age=2592000',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});

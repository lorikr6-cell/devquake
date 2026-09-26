import { createHash } from 'node:crypto';
import type { PluginDatabase, PluginLocale } from '@devquake/plugin-sdk';
import { NEURAL_VOICES, ssml } from './tts';
import type { VoiceGender, VoiceTextSet } from './voice';

// Server only: generates the coach's sentences with Azure neural voices and caches the audio in
// voice_clips. Configured with WORKOUT_TTS_KEY and WORKOUT_TTS_REGION (e.g. "westeurope").

type Db = Omit<PluginDatabase, 'transaction'>;

export function ttsConfigured(): boolean {
  return Boolean(process.env.WORKOUT_TTS_KEY && process.env.WORKOUT_TTS_REGION);
}

/** Generations per person per minute (cached clips do not count). */
const PER_MINUTE = 40;
const recent = new Map<number, number[]>();

export function allowGeneration(userId: number, now = Date.now()): boolean {
  const list = (recent.get(userId) ?? []).filter((t) => now - t < 60_000);
  if (list.length >= PER_MINUTE) {
    recent.set(userId, list);
    return false;
  }
  list.push(now);
  recent.set(userId, list);
  return true;
}

export interface Clip {
  mime: string;
  data: Buffer;
}

/**
 * The audio of a sentence in the page language, the chosen voice and style: from the cache, or
 * generated (then cached). Null when it cannot be made (not configured, the service failed, or
 * too many new sentences at once): the browser then falls back to the device's voice.
 */
export async function voiceClip(
  db: Db,
  userId: number,
  text: string,
  locale: PluginLocale,
  gender: VoiceGender,
  set: VoiceTextSet,
): Promise<Clip | null> {
  const voice = NEURAL_VOICES[locale][gender];
  const key = createHash('sha256').update(`${voice}\u0000${set}\u0000${text}`).digest('hex');
  const [cached] = await db.query<{ mime: string; data: Buffer }>(
    'SELECT mime, data FROM voice_clips WHERE clip_key = ?',
    [key],
  );
  if (cached) {
    await db.execute('UPDATE voice_clips SET used_at = UTC_TIMESTAMP() WHERE clip_key = ?', [key]);
    return cached;
  }
  if (!ttsConfigured() || !allowGeneration(userId)) return null;
  let data: Buffer;
  try {
    const res = await fetch(
      `https://${process.env.WORKOUT_TTS_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.WORKOUT_TTS_KEY!,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
          'User-Agent': 'DevQuake-Workout',
        },
        body: ssml(text, locale, gender, set),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) {
      console.error('[workout] voice generation failed', res.status);
      return null;
    }
    data = Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.error('[workout] voice generation failed', err);
    return null;
  }
  if (data.length === 0) return null;
  await db.execute(
    `INSERT IGNORE INTO voice_clips (clip_key, voice, style, spoken, mime, data, bytes)
     VALUES (?, ?, ?, ?, 'audio/mpeg', ?, ?)`,
    [key, voice, set, text, data, data.length],
  );
  return { mime: 'audio/mpeg', data };
}

/** Clips nobody heard for a long time are removed (a few per scheduled run). */
export async function pruneVoiceClips(db: Db) {
  await db.execute(
    'DELETE FROM voice_clips WHERE used_at < UTC_TIMESTAMP() - INTERVAL 180 DAY LIMIT 500',
  );
}

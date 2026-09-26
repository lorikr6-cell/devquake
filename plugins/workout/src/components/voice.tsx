'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn, LOCALE_TAGS, Sheet, useLocale, useT } from '@devquake/ui';
import {
  DEFAULT_VOICE,
  parseVoiceSettings,
  pickVoice,
  voiceGender,
  voiceTextSet,
  voiceQuality,
  voicesFor,
  voiceTuning,
  VOICE_GENDERS,
  VOICE_STORAGE_KEY,
  VOICE_STYLES,
  type VoiceSettings,
} from '../lib/voice';
import { voiceLabel } from '../lib/tts';

/** Whether DevQuake's natural (neural) voices are available on this server (WORKOUT_TTS_KEY). */
const NaturalVoices = createContext(false);

export function VoiceConfigProvider({
  natural,
  children,
}: {
  natural: boolean;
  children: ReactNode;
}) {
  return <NaturalVoices.Provider value={natural}>{children}</NaturalVoices.Provider>;
}

// ---- Natural voices: one shared <audio> element and a queue of sentences.

type Clip = { text: string; url: string; fallback: () => void };
const player: {
  audio: HTMLAudioElement | null;
  queue: Clip[];
  playing: boolean;
  unlocked: boolean;
} = {
  audio: null,
  queue: [],
  playing: false,
  unlocked: false,
};

/** A short silent WAV: played on the first tap so phones allow the coach's audio later. */
function silentWav(): string {
  const samples = 800;
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);
  const text = (at: number, s: string) =>
    [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples, true);
  text(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  text(36, 'data');
  view.setUint32(40, samples, true);
  bytes.fill(128, 44);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function audioElement(): HTMLAudioElement {
  if (!player.audio) {
    player.audio = new Audio();
    player.audio.preload = 'auto';
  }
  return player.audio;
}

/** Called from the first tap or key press: phones only play audio started by the user once. */
function unlockAudio() {
  if (player.unlocked) return;
  player.unlocked = true;
  const audio = audioElement();
  audio.src = silentWav();
  void audio.play().catch(() => undefined);
}

function playNext() {
  const clip = player.queue.shift();
  if (!clip) {
    player.playing = false;
    return;
  }
  player.playing = true;
  const audio = audioElement();
  const done = () => {
    audio.onended = null;
    audio.onerror = null;
    playNext();
  };
  audio.onended = done;
  audio.onerror = () => {
    // The natural voice could not be loaded: this sentence is said by the device instead.
    clip.fallback();
    done();
  };
  audio.src = clip.url;
  void audio.play().catch(() => {
    clip.fallback();
    done();
  });
}

function playNatural(clip: Clip, interrupt: boolean) {
  if (interrupt) {
    player.queue = [];
    if (player.audio) player.audio.pause();
    player.playing = false;
  }
  player.queue.push(clip);
  if (!player.playing) playNext();
}

function stopNatural() {
  player.queue = [];
  player.audio?.pause();
  player.playing = false;
}

const CHANGE_EVENT = 'dq-workout-voice';

function readSettings(): VoiceSettings {
  try {
    return parseVoiceSettings(localStorage.getItem(VOICE_STORAGE_KEY));
  } catch {
    return DEFAULT_VOICE;
  }
}

/** The voice settings of this device, kept in sync between the toolbar and the workout. */
export function useVoiceSettings(): [VoiceSettings, (change: Partial<VoiceSettings>) => void] {
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_VOICE);
  useEffect(() => {
    const sync = () => setSettings(readSettings());
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const update = useCallback((change: Partial<VoiceSettings>) => {
    const next = { ...readSettings(), ...change };
    try {
      localStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage blocked: the setting lasts for this page only
    }
    setSettings(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return [settings, update];
}

const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/** The device's speech voices, loaded when the browser has them (some fill the list late). */
export function useDeviceVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!supported()) return;
    const synth = window.speechSynthesis;
    const load = () => {
      const list = synth.getVoices();
      if (list.length) setVoices(list);
    };
    load();
    synth.addEventListener('voiceschanged', load);
    // Safari may never announce the list: ask again a few times.
    const retries = [250, 1000, 2500].map((ms) => window.setTimeout(load, ms));
    return () => {
      synth.removeEventListener('voiceschanged', load);
      retries.forEach((id) => window.clearTimeout(id));
    };
  }, []);
  return voices;
}

/** Whether this device can speak the page language: ok, no voice for it, or no speech at all. */
export type SpeakerStatus = 'ok' | 'loading' | 'missing' | 'unsupported';

/**
 * say(text, interrupt?) in the page language, with the chosen (or best) voice and style; silent
 * when muted, when the browser cannot speak, or when the device has no voice for the language
 * (a voice of another language would read the text as nonsense). `interrupt` drops what is
 * still queued (countdowns).
 */
export function useSpeaker() {
  const [settings] = useVoiceSettings();
  const naturalAvailable = useContext(NaturalVoices);
  const natural = naturalAvailable && settings.engine === 'natural';
  const locale = useLocale();
  const lang = LOCALE_TAGS[locale];
  const voices = useDeviceVoices();
  const [canSpeak, setCanSpeak] = useState(true);
  useEffect(() => setCanSpeak(supported()), []);
  const latest = useRef({ voices, settings });
  latest.current = { voices, settings };
  // Said before the voices were known (first seconds on some phones): said once they are.
  const waiting = useRef<string | null>(null);

  useEffect(() => {
    if (!settings.muted) return;
    if (supported()) window.speechSynthesis.cancel();
    stopNatural();
  }, [settings.muted]);

  // Phones allow audio only after a tap: the first one unlocks the natural voice.
  useEffect(() => {
    if (!natural) return;
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [natural]);

  const voice = pickVoice(voices, lang, settings.gender, settings.voices[locale]);
  const status: SpeakerStatus = natural
    ? 'ok'
    : !canSpeak
      ? 'unsupported'
      : voices.length === 0
        ? 'loading'
        : voice
          ? 'ok'
          : 'missing';

  const speakNow = useCallback(
    (text: string, interrupt: boolean) => {
      const { voices: list, settings: current } = latest.current;
      const chosen = pickVoice(list, lang, current.gender, current.voices[locale]);
      if (!chosen) return; // no voice for this language on this device
      const synth = window.speechSynthesis;
      if (interrupt) synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = chosen.lang || lang;
      utterance.voice = chosen;
      // The other gender is suggested with a small pitch shift when the device lacks it.
      const tuning = voiceTuning(current, voiceGender(chosen.name));
      utterance.rate = tuning.rate;
      utterance.pitch = tuning.pitch;
      synth.speak(utterance);
    },
    [lang, locale],
  );

  useEffect(() => {
    if (voices.length && waiting.current) {
      const text = waiting.current;
      waiting.current = null;
      speakNow(text, true);
    }
  }, [voices, speakNow]);

  const say = useCallback(
    (text: string, interrupt = false) => {
      if (latest.current.settings.muted || !text) return;
      if (natural) {
        const current = latest.current.settings;
        const params = new URLSearchParams({
          text,
          gender: current.gender,
          style: voiceTextSet(current),
        });
        playNatural(
          {
            text,
            url: `/api/voice?${params}`,
            fallback: () => {
              if (supported() && latest.current.voices.length) speakNow(text, false);
            },
          },
          interrupt,
        );
        return;
      }
      if (!supported()) return;
      if (latest.current.voices.length === 0) {
        waiting.current = text;
        return;
      }
      speakNow(text, interrupt);
    },
    [speakNow, natural],
  );
  return {
    say,
    natural,
    style: voiceTextSet(settings),
    muted: settings.muted,
    status,
    voice,
    voices: voicesFor(voices, lang),
  };
}

export function SpeakerIcon({ muted, className }: { muted: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M4 9h4l5-4v14l-5-4H4z" />
      {muted ? (
        <path d="M17 9l5 6M22 9l-5 6" />
      ) : (
        <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
      )}
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

/**
 * Mute button and speech settings (voice, style), for the app toolbar and the workout screen.
 * `round` gives the workout screen's round buttons.
 */
export function VoiceMenu({ className, round = false }: { className?: string; round?: boolean }) {
  const t = useT('voiceMenu');
  const tAll = useT();
  const locale = useLocale();
  const [settings, update] = useVoiceSettings();
  const naturalAvailable = useContext(NaturalVoices);
  const { say, status, voice, voices, natural } = useSpeaker();
  const [open, setOpen] = useState(false);
  const canSpeak = status !== 'unsupported';
  const close = useCallback(() => setOpen(false), []);
  const found = voice ? voiceGender(voice.name) : null;
  const sorted = [...voices].sort(
    (a, b) => voiceQuality(b.name) - voiceQuality(a.name) || a.name.localeCompare(b.name),
  );

  const button = round
    ? 'relative flex size-11 items-center justify-center rounded-full border border-ink/15 dark:border-paper/20'
    : 'relative flex size-9 items-center justify-center rounded-md text-ink/70 hover:bg-ink/5 hover:text-quake dark:text-paper/70 dark:hover:bg-paper/10';

  const choice = <T extends string>(value: T, current: T, label: string, pick: (v: T) => void) => (
    <button
      key={value}
      type="button"
      role="radio"
      aria-checked={current === value}
      onClick={() => pick(value)}
      className={cn(
        'min-h-11 flex-1 rounded-md border px-2 text-sm font-medium',
        current === value
          ? 'border-quake bg-quake/10 text-ink dark:bg-quake/20 dark:text-paper'
          : 'border-ink/15 text-ink/80 dark:border-paper/20 dark:text-paper/80',
      )}
    >
      {label}
    </button>
  );

  return (
    <div className={cn('relative flex items-center gap-1', className)}>
      <button
        type="button"
        className={button}
        aria-pressed={settings.muted}
        aria-label={settings.muted ? t('unmute') : t('mute')}
        title={settings.muted ? t('unmute') : t('mute')}
        onClick={() => update({ muted: !settings.muted })}
      >
        <SpeakerIcon muted={settings.muted} className="size-5" />
      </button>
      <button
        type="button"
        className={button}
        aria-expanded={open}
        aria-label={status === 'missing' ? `${t('settings')}: ${t('missingTitle')}` : t('settings')}
        title={t('settings')}
        onClick={() => setOpen(!open)}
      >
        <GearIcon className="size-5" />
        {status === 'missing' && !settings.muted ? (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-amber-500 ring-2 ring-paper dark:ring-ink"
          />
        ) : null}
      </button>
      <Sheet
        open={open}
        onClose={close}
        labelledBy="wo-voice-title"
        className="space-y-4 sm:max-w-sm"
      >
        <h2 id="wo-voice-title" className="font-display text-lg font-bold">
          {t('title')}
        </h2>
        {!canSpeak ? (
          <p className="text-sm text-ink/70 dark:text-paper/70">{t('unsupported')}</p>
        ) : null}
        {naturalAvailable ? (
          <div>
            <p className="mb-1 text-sm font-medium">{t('engine')}</p>
            <div role="radiogroup" aria-label={t('engine')} className="flex gap-2">
              {choice('natural', settings.engine, t('engineNatural'), (v) => update({ engine: v }))}
              {choice('device', settings.engine, t('engineDevice'), (v) => update({ engine: v }))}
            </div>
            {natural ? (
              <p className="mt-1 text-xs text-ink/70 dark:text-paper/70">
                {t('naturalHint', { name: voiceLabel(locale, settings.gender) })}
              </p>
            ) : null}
          </div>
        ) : null}
        {status === 'missing' ? (
          <div className="space-y-1 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <p className="font-semibold">{t('missingTitle')}</p>
            <p>{t('missingBody')}</p>
            <p className="text-xs text-ink/70 dark:text-paper/70">{t('installHelp')}</p>
          </div>
        ) : null}
        <div>
          <p className="mb-1 text-sm font-medium">{t('voice')}</p>
          <div role="radiogroup" aria-label={t('voice')} className="flex gap-2">
            {VOICE_GENDERS.map((g) =>
              choice(g, settings.gender, t(g), (v) => update({ gender: v })),
            )}
          </div>
          {!natural && voice && found !== settings.gender ? (
            <p className="mt-1 text-xs text-ink/70 dark:text-paper/70">
              {t(settings.gender === 'male' ? 'noMaleVoice' : 'noFemaleVoice')}
            </p>
          ) : null}
        </div>
        <div>
          <p className="mb-1 text-sm font-medium">{t('style')}</p>
          <div role="radiogroup" aria-label={t('style')} className="grid grid-cols-2 gap-2">
            {VOICE_STYLES.map((s) => choice(s, settings.style, t(s), (v) => update({ style: v })))}
          </div>
          {settings.style === 'crazy' ? (
            <p className="mt-1 text-xs text-ink/70 dark:text-paper/70">
              {t(settings.gender === 'male' ? 'crazyMaleHint' : 'crazyFemaleHint')}
            </p>
          ) : null}
        </div>
        {!natural && sorted.length > 1 ? (
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t('deviceVoice')}</span>
            <select
              className="min-h-11 w-full rounded-md border border-ink/15 bg-white px-2 text-sm dark:border-paper/20 dark:bg-ink"
              value={settings.voices[locale] ?? ''}
              onChange={(e) => {
                const voicesByLang = { ...settings.voices };
                if (e.target.value) voicesByLang[locale] = e.target.value;
                else delete voicesByLang[locale];
                update({ voices: voicesByLang });
              }}
            >
              <option value="">{t('automatic')}</option>
              {sorted.map((v) => {
                const g = voiceGender(v.name);
                return (
                  <option key={v.name} value={v.name}>
                    {v.name}
                    {g ? ` · ${t(g)}` : ''}
                  </option>
                );
              })}
            </select>
            <span className="mt-1 block text-xs text-ink/60 dark:text-paper/60">
              {t('deviceVoiceHint')}
            </span>
          </label>
        ) : null}
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="size-5 accent-quake"
            checked={!settings.muted}
            onChange={(e) => update({ muted: !e.target.checked })}
          />
          {t('on')}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={settings.muted || status !== 'ok'}
            onClick={() => say(tAll(`voice.${voiceTextSet(settings)}.test`), true)}
            className="min-h-11 flex-1 rounded-md border border-ink/15 text-sm font-medium disabled:opacity-50 dark:border-paper/20"
          >
            {t('test')}
          </button>
          <button
            type="button"
            onClick={close}
            className="min-h-11 flex-1 rounded-md bg-ink text-sm font-medium text-paper dark:bg-paper dark:text-ink"
          >
            {t('close')}
          </button>
        </div>
      </Sheet>
    </div>
  );
}

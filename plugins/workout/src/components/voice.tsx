'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn, LOCALE_TAGS, useLocale, useT } from '@devquake/ui';
import {
  DEFAULT_VOICE,
  parseVoiceSettings,
  pickVoice,
  voiceGender,
  voiceTextSet,
  voiceTuning,
  VOICE_GENDERS,
  VOICE_STORAGE_KEY,
  VOICE_STYLES,
  type VoiceSettings,
} from '../lib/voice';

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

/**
 * say(text, interrupt?) in the page language, with the chosen voice and style; silent when
 * muted or when the browser cannot speak. `interrupt` drops what is still queued (countdowns).
 */
export function useSpeaker() {
  const [settings] = useVoiceSettings();
  const locale = useLocale();
  const voices = useRef<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!supported()) return;
    const load = () => (voices.current = window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);
  useEffect(() => {
    if (settings.muted && supported()) window.speechSynthesis.cancel();
  }, [settings.muted]);

  const say = useCallback(
    (text: string, interrupt = false) => {
      if (settings.muted || !supported() || !text) return;
      const synth = window.speechSynthesis;
      if (interrupt) synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const lang = LOCALE_TAGS[locale];
      utterance.lang = lang;
      // Some browsers (Safari) fill the list late and never announce it: ask again.
      if (voices.current.length === 0) voices.current = synth.getVoices();
      const voice = pickVoice(voices.current, lang, settings.gender);
      if (voice) utterance.voice = voice;
      // A male (or female) voice is made from another one when the device lacks it (ADR 0019).
      const tuning = voiceTuning(settings, voice ? voiceGender(voice.name) : null);
      utterance.rate = tuning.rate;
      utterance.pitch = tuning.pitch;
      synth.speak(utterance);
    },
    [locale, settings],
  );
  return { say, style: voiceTextSet(settings), muted: settings.muted };
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
  const [settings, update] = useVoiceSettings();
  const { say } = useSpeaker();
  const [open, setOpen] = useState(false);
  const [canSpeak, setCanSpeak] = useState(true);
  useEffect(() => setCanSpeak(supported()), []);

  const button = round
    ? 'flex size-11 items-center justify-center rounded-full border border-ink/15 dark:border-paper/20'
    : 'flex size-9 items-center justify-center rounded-md text-ink/70 hover:bg-ink/5 hover:text-quake dark:text-paper/70 dark:hover:bg-paper/10';

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
        aria-label={t('settings')}
        title={t('settings')}
        onClick={() => setOpen(!open)}
      >
        <GearIcon className="size-5" />
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-ink/40 sm:items-center sm:justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wo-voice-title"
            className="w-full space-y-4 mt-88 rounded-t-2xl bg-paper p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-ink sm:max-w-sm sm:rounded-2xl dark:bg-ink dark:text-paper"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="wo-voice-title" className="font-display text-lg font-bold">
              {t('title')}
            </h2>
            {!canSpeak ? (
              <p className="text-sm text-ink/70 dark:text-paper/70">{t('unsupported')}</p>
            ) : null}
            <div>
              <p className="mb-1 text-sm font-medium">{t('voice')}</p>
              <div role="radiogroup" aria-label={t('voice')} className="flex gap-2">
                {VOICE_GENDERS.map((g) =>
                  choice(g, settings.gender, t(g), (v) => update({ gender: v })),
                )}
              </div>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium">{t('style')}</p>
              <div role="radiogroup" aria-label={t('style')} className="grid grid-cols-2 gap-2">
                {VOICE_STYLES.map((s) =>
                  choice(s, settings.style, t(s), (v) => update({ style: v })),
                )}
              </div>
              {settings.style === 'crazy' ? (
                <p className="mt-1 text-xs text-ink/70 dark:text-paper/70">
                  {t(settings.gender === 'male' ? 'crazyMaleHint' : 'crazyFemaleHint')}
                </p>
              ) : null}
            </div>
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
                disabled={settings.muted || !canSpeak}
                onClick={() => say(tAll(`voice.${voiceTextSet(settings)}.test`), true)}
                className="min-h-11 flex-1 rounded-md border border-ink/15 text-sm font-medium disabled:opacity-50 dark:border-paper/20"
              >
                {t('test')}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 flex-1 rounded-md bg-ink text-sm font-medium text-paper dark:bg-paper dark:text-ink"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

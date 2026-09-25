'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, useT } from '@devquake/ui';
import {
  DEFAULT_THEME,
  FONT_CHOICES,
  FONT_IDS,
  FONT_NAMES,
  FONT_TARGETS,
  contrastRatio,
  type FontId,
  type FontTarget,
  type ThemeSettings,
} from '@/lib/custom-theme';
import {
  deleteThemeAction,
  saveThemeAction,
  shareThemeAction,
  unshareThemeAction,
} from '@/lib/theme-actions';
import {
  restorePageTheme,
  saveThemeCookie,
  showBuiltInTheme,
  showCustomTheme,
  snapshotPageTheme,
} from '@/lib/theme-client';
import type { ThemeView } from '@/lib/user-themes';
import { ColorField } from './color-picker';

const field =
  'block w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus:border-quake focus:ring-2 focus:ring-quake/30 focus:outline-none dark:border-paper/20 dark:bg-paper/5 dark:text-paper';

/**
 * Creates or edits a custom theme (ADR 0017). A side panel (a sheet at the bottom on phones)
 * that leaves the page visible: every change is previewed on the page at once. Cancel puts the
 * page back as it was; Save stores the theme and switches to it. The owner can also delete the
 * theme and share it with members by email address.
 */
export function ThemeEditor({
  theme,
  isActive,
  cookieDomain,
  onClose,
}: {
  /** The theme to edit; null for a new one. */
  theme: ThemeView | null;
  /** The page currently uses this theme (deleting it falls back to Adaptive). */
  isActive: boolean;
  cookieDomain?: string;
  onClose: (applied?: string) => void;
}) {
  const t = useT('common.customTheme');
  const router = useRouter();
  const titleId = useId();
  const [name, setName] = useState(theme?.name ?? '');
  const [settings, setSettings] = useState<ThemeSettings>(theme?.settings ?? DEFAULT_THEME);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [shareNote, setShareNote] = useState<{ ok: boolean; text: string } | null>(null);
  const before = useRef<ReturnType<typeof snapshotPageTheme> | null>(null);
  const saved = useRef(false);
  const panel = useRef<HTMLElement>(null);

  // Remember how the page looked, preview every change, and undo the preview unless saved.
  useEffect(() => {
    before.current = snapshotPageTheme();
    panel.current?.focus();
    return () => {
      if (!saved.current && before.current) restorePageTheme(before.current);
    };
  }, []);
  useEffect(() => {
    showCustomTheme(settings, 'preview');
  }, [settings]);

  function cancel() {
    if (before.current) restorePageTheme(before.current);
    onClose();
  }

  const setColor = (key: keyof ThemeSettings['colors']) => (hex: string) =>
    setSettings((s) => ({ ...s, colors: { ...s.colors, [key]: hex } }));
  const setFont = (target: FontTarget, font: FontId | '') =>
    setSettings((s) => {
      const fonts = { ...s.fonts };
      if (font) fonts[target] = font;
      else delete fonts[target];
      return { ...s, fonts };
    });

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveThemeAction(theme?.id ?? null, name, JSON.stringify(settings));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (!result.id) return;
      const choice = `custom-${result.id}` as const;
      saved.current = true;
      saveThemeCookie(choice, cookieDomain);
      showCustomTheme(settings, String(result.id));
      router.refresh();
      onClose(choice);
    });
  }

  function remove() {
    if (!theme) return;
    startTransition(async () => {
      const result = await deleteThemeAction(theme.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      saved.current = true;
      if (isActive || !before.current?.customTheme) {
        saveThemeCookie('adaptive', cookieDomain);
        showBuiltInTheme('adaptive');
      } else {
        restorePageTheme(before.current);
      }
      router.refresh();
      onClose(isActive ? 'adaptive' : undefined);
    });
  }

  function share() {
    if (!theme) return;
    setShareNote(null);
    startTransition(async () => {
      const result = await shareThemeAction(theme.id, email);
      if (result.ok) {
        setEmail('');
        setShareNote({ ok: true, text: t('sharedOk', { name: result.name ?? '' }) });
        router.refresh();
      } else {
        setShareNote({ ok: false, text: result.error });
      }
    });
  }

  const ratio = contrastRatio(settings.colors.text, settings.colors.background);
  return (
    <section
      ref={panel}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') cancel();
      }}
      className="fixed inset-x-0 bottom-0 z-50 max-h-[72vh] overflow-y-auto rounded-t-2xl border border-ink/15 bg-white p-5 text-left text-ink shadow-2xl outline-none sm:inset-x-auto sm:top-20 sm:right-4 sm:bottom-auto sm:max-h-[calc(100vh-6rem)] sm:w-96 sm:rounded-2xl dark:border-paper/15 dark:bg-ink dark:text-paper"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id={titleId} className="font-display text-xl tracking-tight">
          {theme ? t('editorTitle') : t('editorTitleNew')}
        </h2>
        <button
          type="button"
          onClick={cancel}
          aria-label={t('close')}
          className="rounded-md px-2 py-1 text-lg leading-none text-ink/60 hover:bg-ink/5 dark:text-paper/60 dark:hover:bg-paper/10"
        >
          ×
        </button>
      </div>
      <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{t('preview')}</p>

      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label className="block text-sm font-medium">
          {t('name')}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={60}
            placeholder={t('namePlaceholder')}
            className={`${field} mt-1`}
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">{t('colors')}</legend>
          <ColorField
            label={t('background')}
            value={settings.colors.background}
            onChange={setColor('background')}
          />
          <ColorField label={t('text')} value={settings.colors.text} onChange={setColor('text')} />
          <ColorField
            label={t('accent')}
            value={settings.colors.accent}
            onChange={setColor('accent')}
          />
          <p
            role="status"
            className={
              ratio >= 4.5
                ? 'text-xs text-emerald-800 dark:text-emerald-300'
                : 'text-xs font-medium text-red-700 dark:text-red-400'
            }
          >
            {t('contrast', { ratio: ratio.toFixed(1) })} ·{' '}
            {ratio >= 4.5 ? t('contrastGood') : t('contrastLow')}
          </p>
        </fieldset>

        <details className="rounded-md border border-ink/15 dark:border-paper/15">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium">{t('fonts')}</summary>
          <div className="space-y-2 border-t border-ink/10 p-3 dark:border-paper/10">
            <p className="text-xs text-ink/60 dark:text-paper/60">{t('fontsHint')}</p>
            {FONT_TARGETS.map((target) => {
              const font = settings.fonts[target];
              return (
                <label
                  key={target}
                  className="grid grid-cols-[7.5rem_1fr] items-center gap-2 text-sm"
                >
                  <span
                    className="truncate"
                    style={font ? { fontFamily: FONT_CHOICES[font] } : undefined}
                  >
                    {t(`targets.${target}`)}
                  </span>
                  <select
                    value={font ?? ''}
                    onChange={(e) => setFont(target, e.target.value as FontId | '')}
                    className={field}
                  >
                    <option value="">{t('fontDefault')}</option>
                    {FONT_IDS.map((id) => (
                      <option key={id} value={id}>
                        {FONT_NAMES[id]}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
        </details>

        {error ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? t('saving') : t('save')}
          </Button>
          <Button type="button" variant="secondary" onClick={cancel} disabled={pending}>
            {t('cancel')}
          </Button>
        </div>
      </form>

      {theme ? (
        <>
          <section className="mt-6 border-t border-ink/10 pt-4 dark:border-paper/10">
            <h3 className="text-sm font-semibold">{t('share')}</h3>
            <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{t('shareHint')}</p>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                share();
              }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label={t('shareEmail')}
                placeholder={t('shareEmail')}
                autoComplete="off"
                className={`${field} min-w-0 flex-1`}
              />
              <Button type="submit" variant="secondary" disabled={pending || !email}>
                {t('shareButton')}
              </Button>
            </form>
            {shareNote ? (
              <p
                role={shareNote.ok ? 'status' : 'alert'}
                className={
                  shareNote.ok
                    ? 'mt-2 text-xs text-emerald-800 dark:text-emerald-300'
                    : 'mt-2 text-xs text-red-700 dark:text-red-400'
                }
              >
                {shareNote.text}
              </p>
            ) : null}
            {theme.sharedWith?.length ? (
              <div className="mt-3">
                <p className="text-xs font-medium text-ink/70 dark:text-paper/70">
                  {t('sharedWith')}
                </p>
                <ul className="mt-1 space-y-1 text-sm">
                  {theme.sharedWith.map((p) => (
                    <li key={p.userId} className="flex items-center justify-between gap-2">
                      <span className="truncate">{p.name}</span>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await unshareThemeAction(theme.id, p.userId);
                            router.refresh();
                          })
                        }
                        className="text-xs underline decoration-quake/40 underline-offset-2 hover:decoration-quake"
                      >
                        {t('unshare', { name: p.name })}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="mt-6 border-t border-ink/10 pt-4 dark:border-paper/10">
            {confirmDelete ? (
              <div className="space-y-2">
                <p className="text-sm">{t('deleteConfirm')}</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={remove}
                    disabled={pending}
                    className="bg-red-700 text-white hover:bg-red-800"
                  >
                    {t('deleteYes')}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setConfirmDelete(false)}>
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-sm font-medium text-red-700 underline underline-offset-2 dark:text-red-400"
              >
                {t('deleteTheme')}
              </button>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}

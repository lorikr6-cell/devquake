'use client';

import { useActionState } from 'react';
import { Button, LOCALE_NAMES, LOCALES, useT, type Locale } from '@devquake/ui';
import { inlineInputClass, labelClass } from '@/components/form-styles';
import { saveLanguageAction, type LanguageState } from '@/lib/language-actions';

/** Preferred language for the whole site and every app, next to the profile picture. */
export function LanguagePreference({
  current,
  justSaved,
}: {
  /** The saved choice; null = automatic. */
  current: Locale | null;
  /** The page was reopened in the language just chosen. */
  justSaved?: boolean;
}) {
  const t = useT('account.language');
  const [state, save, saving] = useActionState<LanguageState, FormData>(saveLanguageAction, {});
  const saved = state.saved || (justSaved && !state.error);
  return (
    <form action={save} className="min-w-0 space-y-1.5">
      <label htmlFor="preferred-locale" className={labelClass}>
        {t('title')}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <select
          id="preferred-locale"
          name="locale"
          defaultValue={current ?? ''}
          aria-describedby="preferred-locale-hint"
          className={`${inlineInputClass} w-auto`}
        >
          <option value="">{t('automatic')}</option>
          {LOCALES.map((l) => (
            <option key={l} value={l} lang={l}>
              {LOCALE_NAMES[l]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" disabled={saving}>
          {saving ? t('saving') : t('save')}
        </Button>
        {saved && !saving ? (
          <span role="status" className="text-sm text-emerald-800 dark:text-emerald-300">
            {t('saved')}
          </span>
        ) : null}
      </div>
      <p id="preferred-locale-hint" className="max-w-sm text-xs text-ink/60 dark:text-paper/60">
        {t('hint')}
      </p>
      {state.error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

'use client';

import { startTransition, useActionState, useState, type FormEvent } from 'react';
import { Button, cn, useT } from '@devquake/ui';
import { Icon } from '@/components/icons';
import { ProjectAvatar } from '@/components/project-avatar';
import { saveProjectAvatarAction, type AvatarFormState } from '@/lib/project-avatar-actions';
import {
  AUTO_COLORS,
  PROJECT_SYMBOLS,
  projectAvatarLook,
  type ProjectAvatarInput,
} from '@/lib/project-avatar';

/**
 * Colour and symbol of a project's generated logo, with a live preview. Used in /admin-cp and,
 * for projects a user manages, on their account page.
 */
export function ProjectAvatarEditor({
  projectId,
  project,
  color,
  symbol,
}: {
  projectId: number;
  project: Omit<ProjectAvatarInput, 'color' | 'symbol'>;
  color: string | null;
  symbol: string | null;
}) {
  const [state, action, pending] = useActionState<AvatarFormState, FormData>(
    saveProjectAvatarAction.bind(null, projectId),
    {},
  );
  const t = useT('account.logo');
  const auto = projectAvatarLook(project);
  const [customColor, setCustomColor] = useState<string | null>(color);
  const [chosenSymbol, setChosenSymbol] = useState<string | null>(symbol);
  const preview = { ...project, color: customColor, symbol: chosenSymbol };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData();
    data.set('color_mode', customColor ? 'custom' : 'auto');
    if (customColor) data.set('color', customColor);
    data.set('symbol', chosenSymbol ?? 'auto');
    // Without React's automatic reset: the choices stay as picked.
    startTransition(() => action(data));
  }

  const swatch = (value: string | null, title: string) => {
    const active = (customColor?.toUpperCase() ?? null) === (value?.toUpperCase() ?? null);
    return (
      <button
        key={value ?? 'auto'}
        type="button"
        title={title}
        aria-label={title}
        aria-pressed={active}
        onClick={() => setCustomColor(value)}
        className={cn(
          'size-8 rounded-md ring-offset-2 ring-offset-white transition-shadow dark:ring-offset-ink',
          active ? 'ring-2 ring-ink dark:ring-paper' : 'hover:ring-2 hover:ring-ink/30',
        )}
        style={{ background: value ?? auto.autoColor }}
      >
        {value === null ? (
          <span className="text-[10px] font-semibold text-white">{t('auto')}</span>
        ) : null}
      </button>
    );
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center gap-5">
        <ProjectAvatar project={preview} size={64} label={t('preview', { name: project.name })} />
        <ProjectAvatar project={preview} size={36} />
        <p className="text-xs text-ink/60 dark:text-paper/60">
          {t('explain', { initials: auto.initials })}
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t('colour')}</legend>
        <div className="flex flex-wrap items-center gap-2">
          {swatch(null, t('automatic', { value: auto.autoColor }))}
          {AUTO_COLORS.filter((c) => c !== auto.autoColor).map((c) => swatch(c, c))}
          <label className="ml-1 inline-flex items-center gap-2 text-xs text-ink/70 dark:text-paper/70">
            <input
              type="color"
              value={customColor ?? auto.autoColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="size-8 cursor-pointer rounded-md border border-ink/20 bg-transparent p-0.5 dark:border-paper/20"
            />
            {t('anyColour')}
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t('symbol')}</legend>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5">
          {[null, ...PROJECT_SYMBOLS].map((s) => {
            const active = chosenSymbol === s;
            const title =
              s === null
                ? t('automatic', { value: t(`symbols.${auto.autoSymbol}`) })
                : t(`symbols.${s}`);
            return (
              <button
                key={s ?? 'auto'}
                type="button"
                title={title}
                aria-label={title}
                aria-pressed={active}
                onClick={() => setChosenSymbol(s)}
                className={cn(
                  'flex h-11 items-center justify-center rounded-md border text-xs transition-colors',
                  active
                    ? 'border-quake bg-quake/10 text-quake'
                    : 'border-ink/15 text-ink/70 hover:bg-ink/5 dark:border-paper/15 dark:text-paper/70 dark:hover:bg-paper/10',
                )}
              >
                {s === null ? t('auto') : <Icon name={s} size={20} />}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? t('saving') : t('save')}
        </Button>
        {state.saved && !pending ? (
          <span role="status" className="text-sm text-emerald-800 dark:text-emerald-300">
            {t('saved')}
          </span>
        ) : null}
        {state.error ? (
          <span role="alert" className="text-sm text-red-700 dark:text-red-400">
            {state.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}

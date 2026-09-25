'use client';

import { startTransition, useActionState, useEffect, useState, type FormEvent } from 'react';
import { Button, shrinkPhoto, useT } from '@devquake/ui';
import { inputClass, labelClass } from '@/components/form-styles';
import { saveIdeaAction, type IdeaFormState } from '@/lib/community-actions';

export interface IdeaFormValues {
  id: number;
  title: string;
  description: string | null;
  projectId: number | null;
  isPublic: boolean;
  votesEnabled: boolean;
  commentsEnabled: boolean;
  imageUrl: string | null;
}

const toggleClass =
  'flex items-start gap-3 rounded-md border border-ink/10 p-3 text-sm dark:border-paper/10';

/**
 * The idea form for signed-in users: the same fields as the control panel's idea form, minus
 * what only the site decides (status, priority, progress, target date). The picture is shrunk
 * in the browser before it is sent.
 */
export function IdeaForm({
  projects,
  idea,
}: {
  projects: Array<{ id: number; name: string }>;
  idea?: IdeaFormValues;
}) {
  const t = useT('ideas.form');
  const [state, action, pending] = useActionState<IdeaFormState, FormData>(
    saveIdeaAction.bind(null, idea?.id ?? null),
    {},
  );
  const [preview, setPreview] = useState<string | null>(idea?.imageUrl ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState('');
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const data = new FormData(event.currentTarget);
    data.delete('image');
    if (file) {
      setPreparing(true);
      try {
        const blob = await shrinkPhoto(file, 1600, 0.82);
        // Screenshots and drawings (PNG/WebP) often get bigger as JPEG: keep the smaller one.
        const keepOriginal =
          (file.type === 'image/png' || file.type === 'image/webp') && file.size <= blob.size;
        data.set(
          'image',
          keepOriginal ? file : new File([blob], 'idea.jpg', { type: 'image/jpeg' }),
        );
      } catch {
        setError(t('pictureFailed'));
        setPreparing(false);
        return;
      }
      setPreparing(false);
    }
    if (removeImage) data.set('remove_image', 'on');
    // Without React's automatic reset: on an error the form keeps what was typed.
    startTransition(() => action(data));
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="idea-title" className={labelClass}>
          {t('title')}
        </label>
        <input
          id="idea-title"
          name="title"
          required
          minLength={3}
          maxLength={200}
          defaultValue={idea?.title}
          placeholder={t('titlePlaceholder')}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="idea-description" className={labelClass}>
          {t('description')}
        </label>
        <textarea
          id="idea-description"
          name="description"
          rows={6}
          maxLength={5000}
          defaultValue={idea?.description ?? ''}
          placeholder={t('descriptionPlaceholder')}
          className={inputClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="idea-project" className={labelClass}>
            {t('for')}
          </label>
          <select
            id="idea-project"
            name="project_id"
            defaultValue={idea?.projectId ?? ''}
            className={inputClass}
          >
            <option value="">{t('newApp')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className={labelClass}>
            {t('picture')} {t('optional')}
          </span>
          <div className="flex items-center gap-3">
            {preview && !removeImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- local preview / own route
              <img src={preview} alt={t('picture')} className="size-16 rounded-md object-cover" />
            ) : (
              <span
                aria-hidden
                className="flex size-16 items-center justify-center rounded-md border border-dashed border-ink/25 text-ink/40 dark:border-paper/25 dark:text-paper/40"
              >
                🖼
              </span>
            )}
            <div className="space-y-1 text-sm">
              <input
                type="file"
                accept="image/*"
                aria-label={t('choosePicture')}
                className="block w-full text-xs file:mr-2 file:rounded-md file:border file:border-ink/20 file:bg-transparent file:px-2 file:py-1 dark:file:border-paper/20"
                onChange={(e) => {
                  const picked = e.target.files?.[0] ?? null;
                  setFile(picked);
                  setRemoveImage(false);
                  if (picked) setPreview(URL.createObjectURL(picked));
                }}
              />
              {idea?.imageUrl && !file ? (
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={removeImage}
                    onChange={(e) => setRemoveImage(e.target.checked)}
                    className="accent-quake"
                  />
                  {t('removePicture')}
                </label>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className={labelClass}>{t('visibility')}</legend>
        <label className={toggleClass}>
          <input
            type="checkbox"
            name="is_public"
            defaultChecked={idea ? idea.isPublic : true}
            className="mt-0.5 size-4 accent-quake"
          />
          <span>
            <span className="font-medium">{t('public')}</span>
            <span className="block text-xs text-ink/60 dark:text-paper/60">{t('publicHint')}</span>
          </span>
        </label>
        <label className={toggleClass}>
          <input
            type="checkbox"
            name="votes_enabled"
            defaultChecked={idea ? idea.votesEnabled : true}
            className="mt-0.5 size-4 accent-quake"
          />
          <span>
            <span className="font-medium">{t('votes')}</span>
            <span className="block text-xs text-ink/60 dark:text-paper/60">{t('votesHint')}</span>
          </span>
        </label>
        <label className={toggleClass}>
          <input
            type="checkbox"
            name="comments_enabled"
            defaultChecked={idea ? idea.commentsEnabled : true}
            className="mt-0.5 size-4 accent-quake"
          />
          <span>
            <span className="font-medium">{t('comments')}</span>
            <span className="block text-xs text-ink/60 dark:text-paper/60">
              {t('commentsHint')}
            </span>
          </span>
        </label>
      </fieldset>

      {error || state.error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error || state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending || preparing}>
        {preparing ? t('preparing') : pending ? t('saving') : idea ? t('save') : t('share')}
      </Button>
    </form>
  );
}

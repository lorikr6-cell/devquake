'use client';

import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cn, useT } from '@devquake/ui';
import { photoUrl } from '../lib/photos';

export interface ComparePhoto {
  id: number;
  version: string;
  label: string;
  /** Whole months after the starting photo (null for the fixed photo itself). */
  months: number | null;
}

type View = 'side' | 'slider';

/**
 * Start versus month (ADR 0015): the starting photo stays fixed; the other photo steps through
 * the months (and years) with the arrows, the keyboard or a swipe. Shown side by side, or on
 * top of each other with a slider that reveals the later photo.
 */
export function PhotoCompare({ base, others }: { base: ComparePhoto; others: ComparePhoto[] }) {
  const t = useT('photos');
  const [index, setIndex] = useState(others.length - 1);
  const [view, setView] = useState<View>('side');
  const [split, setSplit] = useState(50);
  const swipe = useRef<number | null>(null);
  const current = others[Math.min(index, others.length - 1)];
  if (!current) return null;

  const go = (step: number) => setIndex((i) => Math.max(0, Math.min(others.length - 1, i + step)));
  const onKey = (e: KeyboardEvent) => {
    // The slider uses the arrow keys itself.
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
    else return;
    e.preventDefault();
  };
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') swipe.current = e.clientX;
  };
  const onPointerUp = (e: PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (start === null) return;
    const dx = e.clientX - start;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };

  const since =
    current.months === null || current.months === 0
      ? t('sameMonth')
      : t('monthsSince', { count: current.months });

  const photo = (p: ComparePhoto, className?: string) => (
    // A plain <img>: the photo comes from the app's own API, only for its owner.
    <img
      src={photoUrl(p.id, p.version)}
      alt={p.label}
      className={cn('size-full object-cover', className)}
      draggable={false}
    />
  );
  const tag = (text: string, side: 'left' | 'right') => (
    <span
      className={cn(
        'absolute top-2 max-w-[80%] truncate rounded bg-ink/70 px-2 py-0.5 text-xs text-paper',
        side === 'left' ? 'left-2' : 'right-2',
      )}
    >
      {text}
    </span>
  );

  const stepper = (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => go(-1)}
        disabled={index === 0}
        aria-label={t('previousPhoto')}
        className="size-11 shrink-0 rounded-md border border-ink/15 text-xl leading-none hover:bg-ink/5 disabled:opacity-30 dark:border-paper/20 dark:hover:bg-paper/10"
      >
        ‹
      </button>
      <div className="min-w-0 text-center" aria-live="polite">
        <p className="truncate text-sm font-semibold">{current.label}</p>
        <p className="text-xs text-ink/60 dark:text-paper/60">
          {since} · {t('position', { index: index + 1, count: others.length })}
        </p>
      </div>
      <button
        type="button"
        onClick={() => go(1)}
        disabled={index === others.length - 1}
        aria-label={t('nextPhoto')}
        className="size-11 shrink-0 rounded-md border border-ink/15 text-xl leading-none hover:bg-ink/5 disabled:opacity-30 dark:border-paper/20 dark:hover:bg-paper/10"
      >
        ›
      </button>
    </div>
  );

  return (
    <div
      className="space-y-3 outline-none"
      tabIndex={0}
      onKeyDown={onKey}
      role="group"
      aria-label={t('compareTitle')}
    >
      <div
        role="group"
        aria-label={t('view')}
        className="inline-flex rounded-md border border-ink/15 p-0.5 dark:border-paper/15"
      >
        {(['side', 'slider'] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={cn(
              'min-h-9 rounded px-3 text-sm',
              view === v
                ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                : 'text-ink/70 hover:bg-ink/5 dark:text-paper/70 dark:hover:bg-paper/10',
            )}
          >
            {t(v === 'side' ? 'sideBySide' : 'overlay')}
          </button>
        ))}
      </div>

      {view === 'side' ? (
        <div className="grid grid-cols-2 gap-3">
          <figure>
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-ink/5 dark:bg-paper/10">
              {photo(base)}
              {tag(t('fixed'), 'left')}
            </div>
            <figcaption className="mt-2 text-center text-sm font-semibold">{base.label}</figcaption>
          </figure>
          <figure>
            <div
              className="relative aspect-[3/4] touch-pan-y overflow-hidden rounded-xl bg-ink/5 select-none dark:bg-paper/10"
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={() => (swipe.current = null)}
            >
              {photo(current)}
            </div>
            <figcaption className="mt-2">{stepper}</figcaption>
          </figure>
        </div>
      ) : (
        <div className="max-w-md space-y-3">
          <div
            className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-ink/5 dark:bg-paper/10"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            {photo(base, 'absolute inset-0')}
            <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
              {photo(current)}
            </div>
            <div
              aria-hidden
              className="absolute inset-y-0 w-0.5 bg-white shadow"
              style={{ left: `${split}%` }}
            />
            {tag(base.label, 'left')}
            {tag(current.label, 'right')}
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={split}
            onChange={(e) => setSplit(Number(e.target.value))}
            aria-label={t('slider')}
            className="w-full accent-quake"
          />
          {stepper}
        </div>
      )}
    </div>
  );
}

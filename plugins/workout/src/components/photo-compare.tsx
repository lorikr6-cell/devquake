'use client';

import { useState } from 'react';
import { useT } from '@devquake/ui';
import { photoUrl } from '../lib/photos';

export interface ComparePhoto {
  id: number;
  version: string;
  label: string;
}

/**
 * Before and after (ADR 0015): two photos on top of each other, with a slider that reveals the
 * "after" one. Both photos can be chosen from the person's timeline.
 */
export function PhotoCompare({ photos }: { photos: ComparePhoto[] }) {
  const t = useT('photos');
  const [before, setBefore] = useState(0);
  const [after, setAfter] = useState(photos.length - 1);
  const [split, setSplit] = useState(50);
  const a = photos[before];
  const b = photos[after];
  if (!a || !b || photos.length < 2) return null;

  const select = (value: number, onChange: (n: number) => void, label: string) => (
    <label className="block flex-1 text-xs font-medium">
      {label}
      <select
        className="mt-1 w-full rounded-md border border-ink/15 bg-white px-2 py-2 text-sm dark:border-paper/15 dark:bg-ink"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {photos.map((p, i) => (
          <option key={p.id} value={i}>
            {p.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div>
      <div className="flex gap-2">
        {select(before, setBefore, t('before'))}
        {select(after, setAfter, t('after'))}
      </div>
      <div className="relative mt-3 aspect-[3/4] w-full max-w-md overflow-hidden rounded-xl bg-ink/5 dark:bg-paper/10">
        <img
          src={photoUrl(a.id, a.version)}
          alt={a.label}
          className="absolute inset-0 size-full object-cover"
        />
        <img
          src={photoUrl(b.id, b.version)}
          alt={b.label}
          className="absolute inset-0 size-full object-cover"
          style={{ clipPath: `inset(0 0 0 ${split}%)` }}
        />
        <div
          aria-hidden
          className="absolute inset-y-0 w-0.5 bg-white shadow"
          style={{ left: `${split}%` }}
        />
        <span className="absolute top-2 left-2 rounded bg-ink/70 px-2 py-0.5 text-xs text-paper">
          {a.label}
        </span>
        <span className="absolute top-2 right-2 rounded bg-ink/70 px-2 py-0.5 text-xs text-paper">
          {b.label}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={split}
        onChange={(e) => setSplit(Number(e.target.value))}
        aria-label={t('slider')}
        className="mt-3 w-full max-w-md accent-quake"
      />
    </div>
  );
}

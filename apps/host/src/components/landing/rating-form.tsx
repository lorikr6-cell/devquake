'use client';

import { useActionState, useState } from 'react';
import { cn } from '@devquake/ui';
import { rateProjectAction, type RateState } from '@/lib/feedback-actions';

const LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function Stars({ name, label, initial }: { name: string; label: string; initial: number | null }) {
  const [value, setValue] = useState(initial ?? 0);
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <legend className="sr-only">{label}</legend>
      <span aria-hidden className="w-24 text-sm">
        {label}
      </span>
      <input type="hidden" name={name} value={value || ''} />
      <span className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setValue(n === value ? 0 : n)}
            onMouseEnter={() => setHover(n)}
            aria-pressed={n <= value}
            aria-label={`${label}: ${n} of 5 (${LABELS[n - 1]})`}
            className={cn(
              'px-0.5 text-xl leading-none transition-colors focus-visible:outline-2 focus-visible:outline-quake',
              n <= shown ? 'text-quake' : 'text-ink/25 dark:text-paper/25',
            )}
          >
            ★
          </button>
        ))}
      </span>
      <span className="text-xs text-ink/60 dark:text-paper/60">
        {shown ? LABELS[shown - 1] : 'Not rated'}
      </span>
    </fieldset>
  );
}

/** Rate a live project on quality and usefulness (1..5 stars each; click a star again to clear). */
export function RatingForm({
  projectId,
  quality,
  usefulness,
}: {
  projectId: number;
  quality: number | null;
  usefulness: number | null;
}) {
  const [state, action, pending] = useActionState<RateState, FormData>(
    rateProjectAction.bind(null, projectId),
    {},
  );
  const rated = quality !== null || usefulness !== null;
  return (
    <form action={action} className="space-y-2">
      <p className="text-xs font-medium tracking-wider text-ink/60 uppercase dark:text-paper/60">
        {rated ? 'Your rating' : 'Rate this app'}
      </p>
      <Stars name="quality" label="Quality" initial={quality} />
      <Stars name="usefulness" label="Usefulness" initial={usefulness} />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none dark:border-paper/20 dark:hover:bg-paper/10"
        >
          {pending ? 'Saving…' : rated ? 'Update rating' : 'Save rating'}
        </button>
        {state.error ? (
          <p role="alert" className="text-xs text-red-700 dark:text-red-400">
            {state.error}
          </p>
        ) : state.saved ? (
          <p role="status" className="text-xs text-emerald-800 dark:text-emerald-300">
            Thanks for rating!
          </p>
        ) : null}
      </div>
    </form>
  );
}

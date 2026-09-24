'use client';

import { Fragment, useRef, type ReactNode } from 'react';
import { cn } from './cn';

export interface ReleaseNotesEntry {
  version: string;
  date?: string;
  notes: string[];
}

/** **bold** and `code` from changelog notes, as elements (never raw HTML). */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={i} className="rounded bg-ink/5 px-1 text-[0.9em] dark:bg-paper/10">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/**
 * A small "v1.2.0" button that opens the release notes (a plugin's CHANGELOG.md) in a dialog.
 * Renders nothing when there are no entries.
 */
export function ReleaseNotes({
  entries,
  title,
  label,
  className,
}: {
  entries: ReleaseNotesEntry[];
  /** Shown in the dialog heading, e.g. the app's name. */
  title: string;
  /** Button text; default "v<latest version>". */
  label?: string;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const latest = entries[0];
  if (!latest) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        title="What's new"
        className={cn(
          'rounded-full border border-ink/15 px-2 py-0.5 text-xs font-medium text-ink/70 hover:border-quake hover:text-quake dark:border-paper/20 dark:text-paper/70',
          className,
        )}
      >
        {label ?? `v${latest.version}`}
      </button>
      <dialog
        ref={dialog}
        aria-label={`${title}: what's new`}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto max-h-[85vh] w-[36rem] max-w-[92vw] rounded-xl bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink/60 dark:bg-ink dark:text-paper"
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-3 dark:border-paper/10">
          <h2 className="font-display text-lg font-bold">What’s new in {title}</h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="rounded-md px-2 py-1 text-sm underline hover:text-quake"
          >
            Close
          </button>
        </div>
        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-4 text-sm">
          {entries.map((entry, i) => (
            <section key={entry.version}>
              <h3 className="flex items-baseline gap-2 font-semibold">
                <span>Version {entry.version}</span>
                {i === 0 ? (
                  <span className="rounded-full bg-quake/15 px-2 text-xs font-medium text-quake">
                    latest
                  </span>
                ) : null}
                {entry.date ? (
                  <span className="text-xs font-normal text-ink/60 dark:text-paper/60">
                    {entry.date}
                  </span>
                ) : null}
              </h3>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {entry.notes.map((note) => (
                  <li key={note}>{inline(note)}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </dialog>
    </>
  );
}

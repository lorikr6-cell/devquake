import type { ReactNode } from 'react';

/**
 * A section that starts collapsed: the heading (with a count and, if any, a warning) is always
 * visible and opens the content. Native <details>, so it works without JavaScript and with the
 * keyboard; an anchor such as /account#account-activity still scrolls to it.
 */
export function CollapsibleSection({
  id,
  title,
  count,
  warning,
  children,
}: {
  id: string;
  title: string;
  /** Shown next to the title, e.g. "10 entries". */
  count?: string;
  /** Shown in red while collapsed too, e.g. "2 failed", so nothing important stays hidden. */
  warning?: string | null;
  children: ReactNode;
}) {
  return (
    <details id={id} className="group mt-10 scroll-mt-24">
      <summary className="flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 gap-y-1 rounded-md py-1 focus-visible:outline-2 focus-visible:outline-quake [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="inline-block w-4 text-ink/50 transition-transform group-open:rotate-90 dark:text-paper/50"
        >
          ▸
        </span>
        <h2 className="font-display text-xl tracking-tight">{title}</h2>
        {count ? <span className="text-sm text-ink/60 dark:text-paper/60">{count}</span> : null}
        {warning ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950 dark:text-red-300">
            {warning}
          </span>
        ) : null}
        <span className="sr-only group-open:hidden">(show)</span>
      </summary>
      <div className="pl-7">{children}</div>
    </details>
  );
}

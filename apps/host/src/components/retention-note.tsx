import { cn } from '@devquake/ui';

/** "Entries older than 3 months are deleted automatically." under an activity section. */
export function RetentionNote({
  days,
  what,
  className,
}: {
  days: number;
  /** What is cleaned up, e.g. "Sign-in activity". */
  what: string;
  className?: string;
}) {
  const period = days % 30 === 0 ? `${days / 30} months` : `${days} days`;
  return (
    <p
      className={cn(
        'mt-1 flex items-center gap-1.5 text-xs text-ink/60 dark:text-paper/60',
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="size-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <circle cx="8" cy="8" r="6.25" />
        <path d="M8 4.5V8l2.5 1.5" />
      </svg>
      {what} older than {period} is deleted automatically.
    </p>
  );
}

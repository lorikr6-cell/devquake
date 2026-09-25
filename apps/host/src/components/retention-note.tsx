import { cn } from '@devquake/ui';
import { getT } from '@/i18n/server';

/** "Account activity older than 3 months is deleted automatically." under an activity section. */
export async function RetentionNote({
  days,
  what,
  className,
}: {
  days: number;
  /** Which note: the cleaned-up data it talks about. */
  what: 'accountActivity' | 'signinActivity' | 'messages';
  className?: string;
}) {
  const t = await getT('common.retention');
  const period =
    days % 365 === 0
      ? t('years', { count: days / 365 })
      : days % 30 === 0
        ? t('months', { count: days / 30 })
        : t('days', { count: days });
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
      {t(what, { period })}
    </p>
  );
}

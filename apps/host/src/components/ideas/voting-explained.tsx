import { Link, rich } from '@devquake/ui';
import { getT } from '@/i18n/server';
import { PRIVACY_PATH } from '@/lib/legal';

/** What voting means and the few rules for posting. Shown on the ideas pages. */
export async function VotingExplained({ compact = false }: { compact?: boolean }) {
  const t = await getT('ideas.explained');
  return (
    <aside className="rounded-lg border border-quake/30 bg-quake/5 p-4 text-sm">
      <p className="font-semibold">{t('title')}</p>
      <p className="mt-1">
        {rich(t('body'), {
          link: (
            <Link href={PRIVACY_PATH} className="underline decoration-quake/50 underline-offset-2">
              {t('privacy')}
            </Link>
          ),
        })}
      </p>
      {compact ? null : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-ink/80 dark:text-paper/80">
          <li>{t('public')}</li>
          <li>{t('rules')}</li>
          <li>{t('yours')}</li>
        </ul>
      )}
    </aside>
  );
}

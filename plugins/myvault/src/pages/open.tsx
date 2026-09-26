import { notFound, redirect } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { formatDateTime, localizePath } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { OpenEntry } from '../components/open-entry';
import { Notice, Panel } from '../components/ui';
import { HttpError, entryForOpening } from '../lib/data';
import { categoryIcon } from '../lib/model';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.open') };
}

/**
 * A released entry, for its recipients (open to every signed-in member, ADR 0022; the entry
 * itself checks that this person is a recipient). Its owner is sent to their own page.
 */
export default async function OpenPage({ params, ctx }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const locale = localeOf(ctx);
  const t = translator(locale, 'openPage');
  const entryId = Number(params.id);
  if (!Number.isSafeInteger(entryId) || entryId <= 0) notFound();
  const access = await entryForOpening(scope.db, entryId, scope.user.id).catch((err) => {
    if (err instanceof HttpError) return null;
    throw err;
  });
  if (!access) {
    return (
      <Notice title={t('notFoundTitle')}>
        <p>{t('notFoundBody')}</p>
      </Notice>
    );
  }
  if (access.isOwner) redirect(localizePath(`/entries/${entryId}`, locale));
  const { entry } = access;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">
          <span aria-hidden>{categoryIcon(entry.category)} </span>
          {entry.title}
        </h1>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
          {t('from', {
            name: entry.ownerName,
            date: entry.releasedAt
              ? formatDateTime(entry.releasedAt, ctx.timeZone ?? 'UTC', 'long-date', locale)
              : '',
          })}
        </p>
      </div>
      <Panel className="space-y-4">
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
        <OpenEntry
          entryId={entry.id}
          questions={access.questions}
          isOwner={false}
          locked={entry.lockedUntil}
        />
      </Panel>
    </div>
  );
}

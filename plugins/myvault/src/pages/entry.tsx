import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { DeleteEntryButton, OwnerWorkspace, UnlockButton } from '../components/entry-actions';
import { pageScope } from '../components/guard';
import { entryStatus } from '../components/status';
import { Panel } from '../components/ui';
import { HttpError, attemptsFor, requireOwnEntry } from '../lib/data';
import { categoryIcon, type Question } from '../lib/model';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.entry') };
}

/** An answer of a failed try, as the owner can read it (choices by their text). */
function answerText(q: Question | undefined, a: unknown): string {
  if (a === null || a === undefined || a === '') return '—';
  if (q?.type === 'single') return q.options?.[Number(a)] ?? String(a);
  if (q?.type === 'multi' && Array.isArray(a))
    return a.map((i) => q.options?.[Number(i)] ?? String(i)).join(', ');
  return String(a);
}

/** The owner's page: state, open and edit, recipients and release, every try, delete. */
export default async function EntryPage({ params, ctx }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user } = scope;
  const entryId = Number(params.id);
  if (!Number.isSafeInteger(entryId) || entryId <= 0) notFound();
  const access = await requireOwnEntry(db, entryId, user.id).catch((err) => {
    if (err instanceof HttpError) notFound();
    throw err;
  });
  const { entry, questions } = access;
  const locale = localeOf(ctx);
  const t = translator(locale, 'entry');
  const tA = translator(locale, 'attempts');
  const tz = ctx.timeZone ?? 'UTC';
  const status = entryStatus(entry, translator(locale, 'status'), tz, locale);
  const { attempts } = await attemptsFor(db, entryId, user.id);
  const network = ((await ctx.people?.referrals().catch(() => [])) ?? []).map((p) => ({
    id: p.id,
    displayName: p.displayName,
    hasAccess: p.hasAccess,
  }));
  // Current recipients who are no longer in the referral list stay selectable.
  const people = [
    ...network,
    ...entry.recipientList
      .filter((r) => !network.some((p) => p.id === r.id))
      .map((r) => ({ id: r.id, displayName: r.name, hasAccess: false })),
  ];
  const days = entry.inactiveDays ?? 90;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-ink/60 hover:text-quake dark:text-paper/60">
          {t('back')}
        </Link>
        <h1 className="font-display text-3xl font-bold">
          <span aria-hidden>{categoryIcon(entry.category)} </span>
          {entry.title}
        </h1>
        <p className="mt-1 text-sm">
          <span aria-hidden>{status.icon} </span>
          {status.text}
        </p>
      </div>

      {entry.lockedUntil ? (
        <Panel className="flex flex-wrap items-center justify-between gap-3 border-red-500/40 bg-red-500/5">
          <p className="text-sm">{t('lockedBody')}</p>
          <UnlockButton entryId={entry.id} />
        </Panel>
      ) : null}

      <OwnerWorkspace
        entryId={entry.id}
        questions={questions}
        locked={entry.lockedUntil}
        released={Boolean(entry.releasedAt)}
        people={people}
        release={{
          recipients: entry.recipientList.map((r) => r.id),
          amount: String(days % 30 === 0 ? days / 30 : days),
          unit: days % 30 === 0 ? 'months' : 'days',
          notBefore: entry.notBefore ?? '',
        }}
        hostUrl={ctx.hostUrl}
        titles={{ open: t('openTitle'), release: t('releaseTitle') }}
      />

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">{tA('title')}</h2>
        <p className="text-sm text-ink/70 dark:text-paper/70">{tA('intro')}</p>
        {attempts.length === 0 ? (
          <p className="text-sm text-ink/60 dark:text-paper/60">{tA('none')}</p>
        ) : (
          <ul className="space-y-2">
            {attempts.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-ink/10 px-3 py-2 text-sm dark:border-paper/10"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {a.ok ? '✔ ' : '✖ '}
                    {a.userName ?? tA('someone')}
                    {a.isOwner ? (
                      <span className="text-ink/50 dark:text-paper/50"> {tA('you')}</span>
                    ) : null}
                  </span>
                  <span className="text-xs text-ink/60 dark:text-paper/60">
                    {formatDateTime(a.at, tz, 'datetime', locale)}
                  </span>
                </div>
                <p className="text-xs text-ink/70 dark:text-paper/70">
                  {a.ok ? tA('ok') : a.keyOk ? tA('wrongAnswers') : tA('wrongKey')}
                </p>
                {a.answers ? (
                  <ul className="mt-1 list-inside list-disc text-xs text-ink/70 dark:text-paper/70">
                    {a.answers.map((ans, i) => (
                      <li key={i}>
                        {questions[i]?.prompt}: <strong>{answerText(questions[i], ans)}</strong>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-6 dark:border-paper/10">
        <p className="text-xs text-ink/60 dark:text-paper/60">
          {t('created', { date: formatDateTime(entry.createdAt, tz, 'long-date', locale) })}
        </p>
        <DeleteEntryButton entryId={entry.id} title={entry.title} />
      </section>
    </div>
  );
}

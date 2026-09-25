import { AccountShell } from '@/components/account/account-shell';
import { ContactForm } from '@/components/contact-form';
import { DateTime } from '@/components/date-time';
import { RetentionNote } from '@/components/retention-note';
import { requireUser } from '@/lib/auth/admin';
import { listMyMessages, markRepliesSeen } from '@/lib/contact';
import { deleteMyMessageAction } from '@/lib/contact-actions';
import { RETENTION_DAYS } from '@/lib/retention';
import { rich } from '@devquake/ui';
import { getT } from '@/i18n/server';

export async function generateMetadata() {
  return { title: (await getT('contact.mine'))('metaTitle'), robots: { index: false } };
}

// All times on this page are in the visitor's own time zone (<DateTime>, ADR 0010).

/**
 * A member's messages to DevQuake with the owner's replies, and a form to write a new one
 * (name and email come from the account). Only the member's own messages are listed.
 */
export default async function MyMessagesPage() {
  const user = await requireUser();
  const messages = await listMyMessages(user.userId).catch(() => []);
  const t = await getT('contact.mine');
  // Opening the page counts as reading the replies (the "New" marks below use the old time).
  await markRepliesSeen(user.userId);

  return (
    <AccountShell user={user} page="messages">
      <h1 className="font-display text-3xl tracking-tight">{t('title')}</h1>
      <p className="mt-2 max-w-prose text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>

      <section
        aria-labelledby="write-heading"
        className="mt-6 rounded-lg border border-ink/10 bg-white p-5 dark:border-paper/10 dark:bg-paper/5"
      >
        <h2 id="write-heading" className="mb-4 font-semibold">
          {t('new')}
        </h2>
        <ContactForm sender={{ name: user.displayName, email: user.email }} />
      </section>

      <section aria-labelledby="list-heading" className="mt-10">
        <h2 id="list-heading" className="font-display text-xl tracking-tight">
          {t('sent')}{' '}
          <span className="text-base text-ink/60 dark:text-paper/60">({messages.length})</span>
        </h2>
        <RetentionNote days={RETENTION_DAYS.contactMessages} what="messages" />
        {messages.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60 dark:text-paper/60">{t('none')}</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {messages.map((m) => {
              const isNew = (at: Date) => !m.seenAt || new Date(at) > new Date(m.seenAt);
              const fresh = m.replies.filter((r) => isNew(r.created_at)).length;
              return (
                <li
                  key={m.id}
                  id={`message-${m.id}`}
                  className="rounded-lg border border-ink/10 bg-white p-5 dark:border-paper/10 dark:bg-paper/5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{m.subject ?? t('noSubject')}</h3>
                      <p className="text-xs text-ink/60 dark:text-paper/60">
                        {rich(t('sentAt'), { date: <DateTime value={m.created_at} /> })}
                      </p>
                    </div>
                    {m.replies.length ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100">
                        {fresh ? t('newReplies', { count: fresh }) : t('replied')}
                      </span>
                    ) : (
                      <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/70 dark:bg-paper/10 dark:text-paper/70">
                        {t('waiting')}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm whitespace-pre-wrap">{m.message}</p>

                  {m.replies.length > 0 ? (
                    <ol className="mt-4 space-y-3">
                      {m.replies.map((r) => (
                        <li
                          key={r.id}
                          className="rounded-md border-l-4 border-quake bg-paper p-3 text-sm dark:bg-ink/60"
                        >
                          <p className="text-xs text-ink/60 dark:text-paper/60">
                            <span className="font-medium text-ink dark:text-paper">
                              {t('replyBy')}
                            </span>{' '}
                            · <DateTime value={r.created_at} />
                            {isNew(r.created_at) ? (
                              <span className="ml-2 rounded-full bg-quake px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                {t('newBadge')}
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">{r.body}</p>
                        </li>
                      ))}
                    </ol>
                  ) : null}

                  <details className="mt-4 text-sm">
                    <summary className="inline-block cursor-pointer list-none rounded-md border border-red-600 px-3 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950 [&::-webkit-details-marker]:hidden">
                      {t('delete')}
                    </summary>
                    <form action={deleteMyMessageAction.bind(null, m.id)} className="mt-2">
                      <p className="text-xs">
                        {m.replies.length ? t('confirmWithReplies') : t('confirm')}
                      </p>
                      <button
                        type="submit"
                        className="mt-2 rounded-md bg-red-700 px-3 py-1 text-xs font-medium text-white hover:bg-red-800"
                      >
                        {t('yesDelete')}
                      </button>
                    </form>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AccountShell>
  );
}

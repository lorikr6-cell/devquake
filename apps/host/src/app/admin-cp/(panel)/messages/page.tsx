import { DateTime } from '@/components/date-time';
import Link from 'next/link';
import { cn } from '@devquake/ui';
import { emailLinkClass } from '@/components/form-styles';
import { ADMIN_BASE, requireOwner } from '@/lib/auth/admin';
import { MESSAGE_STATUSES, listMessages, type MessageStatus } from '@/lib/contact';
import { PageHeader, Panel, linkClass } from '../../_components/ui';
import { setMessageStatusAction } from './actions';

export const metadata = { title: 'Messages' };

type Props = { searchParams: Promise<{ status?: string }> };

const LABELS: Record<MessageStatus, string> = { new: 'New', read: 'Read', archived: 'Archived' };

export default async function MessagesPage({ searchParams }: Props) {
  await requireOwner();
  const { status } = await searchParams;
  const messages = await listMessages(status);

  const tab = (value: string | undefined, label: string) => (
    <Link
      key={value ?? 'inbox'}
      href={value ? `${ADMIN_BASE}/messages?status=${value}` : `${ADMIN_BASE}/messages`}
      aria-current={status === value ? 'page' : undefined}
      className={cn(
        'border-b-2 px-3 py-1.5 text-sm',
        status === value
          ? 'border-quake font-medium'
          : 'border-transparent text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper',
      )}
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHeader title="Messages" />
      <nav className="mb-4 flex gap-1 border-b border-ink/10 dark:border-paper/10">
        {tab(undefined, 'Inbox')}
        {MESSAGE_STATUSES.map((s) => tab(s, LABELS[s]))}
      </nav>

      <div className="space-y-4">
        {messages.map((m) => (
          <Panel key={m.id} className={cn(m.status === 'new' && 'border-l-4 border-l-quake')}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {m.subject ?? 'No subject'}
                  {m.status === 'new' && (
                    <span className="ml-2 rounded-full bg-quake/15 px-2 py-0.5 text-xs font-medium">
                      New
                    </span>
                  )}
                </p>
                <p className="text-sm text-ink/70 dark:text-paper/70">
                  {m.name} ·{' '}
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject ?? 'your message to DevQuake'}`)}`}
                    className={emailLinkClass}
                  >
                    {m.email}
                  </a>
                  {m.user_id && (
                    <>
                      {' · '}
                      <Link href={`${ADMIN_BASE}/users/${m.user_id}`} className={linkClass}>
                        registered user
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <p className="text-xs text-ink/60 dark:text-paper/60">
                <DateTime value={m.created_at} />
                {m.ip && <span className="block font-mono">{m.ip}</span>}
                {!m.emailed && (
                  <span className="block text-amber-800 dark:text-amber-300">email not sent</span>
                )}
              </p>
            </div>
            <p className="mt-3 text-sm whitespace-pre-wrap">{m.message}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {MESSAGE_STATUSES.filter((s) => s !== m.status).map((s) => (
                <form key={s} action={setMessageStatusAction.bind(null, m.id)}>
                  <input type="hidden" name="status" value={s} />
                  <button
                    type="submit"
                    className="rounded-md border border-ink/20 px-3 py-1 text-xs hover:bg-ink/5 dark:border-paper/20 dark:hover:bg-paper/10"
                  >
                    Mark as {LABELS[s].toLowerCase()}
                  </button>
                </form>
              ))}
            </div>
          </Panel>
        ))}
        {messages.length === 0 && (
          <p className="text-sm text-ink/60 dark:text-paper/60">No messages here.</p>
        )}
      </div>
    </>
  );
}

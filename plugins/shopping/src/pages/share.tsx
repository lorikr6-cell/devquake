import Link from 'next/link';
import { notFound } from 'next/navigation';
import { brandedQrSvg } from '@devquake/ui/qr';
import type { PluginPageProps, PluginPerson } from '@devquake/plugin-sdk';
import { pageScope } from '../components/guard';
import {
  AddFriendButton,
  CopyButton,
  ListSettingsForm,
  RemoveMemberButton,
  RotateInviteButton,
} from '../components/share-actions';
import { Panel } from '../components/ui';
import { HttpError, activeInvite, snapshot } from '../lib/data';

export const metadata = { title: 'Share shopping list' };

export default async function SharePage({ params, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user } = scope;
  const listId = Number(params.id);
  if (!Number.isSafeInteger(listId) || listId <= 0) notFound();
  const list = await snapshot(db, listId, user.id).catch((err) => {
    if (err instanceof HttpError) notFound();
    throw err;
  });
  const isOwner = list.role === 'owner';

  let invite: { code: string; url: string; qr: string } | null = null;
  let friends: PluginPerson[] = [];
  if (isOwner) {
    const code = await activeInvite(db, listId, user.id);
    const url = `${ctx.baseUrl}/join/${code}`;
    const qr = brandedQrSvg(url, { margin: 1 });
    invite = { code, url, qr };
    const memberIds = new Set(list.members.map((m) => m.userId));
    friends = ((await ctx.people?.referrals().catch(() => [])) ?? []).filter(
      (p) => !memberIds.has(p.id),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/lists/${list.id}`}
          className="text-sm text-ink/60 hover:text-quake dark:text-paper/60"
        >
          ← Back to the list
        </Link>
        <h1 className="font-display text-3xl font-bold">{list.name}</h1>
      </div>

      {invite ? (
        <Panel className="grid gap-5 sm:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold">Invite with a link</h2>
            <p className="text-sm text-ink/70 dark:text-paper/70">
              Anyone with a DevQuake account who opens this link (or scans the code) can join the
              list. They need access to the shopping lists app on DevQuake.
            </p>
            <p className="font-mono text-2xl tracking-widest">{invite.code}</p>
            <p className="break-all text-sm text-ink/60 dark:text-paper/60">{invite.url}</p>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={invite.url} />
              <RotateInviteButton listId={list.id} />
            </div>
          </div>
          <div
            className="size-40 justify-self-center overflow-hidden rounded-lg bg-white p-1 [&>svg]:size-full"
            role="img"
            aria-label="QR code of the invite link"
            dangerouslySetInnerHTML={{ __html: invite.qr }}
          />
        </Panel>
      ) : null}

      {isOwner ? (
        <Panel>
          <h2 className="font-display text-lg font-semibold">Your friends on DevQuake</h2>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
            People you invited to DevQuake, and the person who invited you. Add them straight to
            this list, no link needed.
          </p>
          {friends.length === 0 ? (
            <p className="mt-3 text-sm text-ink/60 dark:text-paper/60">
              Nobody to add yet.{' '}
              <a className="font-medium text-quake underline" href={`${ctx.hostUrl}/#account`}>
                Invite friends to DevQuake
              </a>{' '}
              with your referral link, and they will show up here once they join.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-ink/10 dark:divide-paper/10">
              {friends.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <p className="font-medium">{p.displayName}</p>
                    <p className="text-xs text-ink/60 dark:text-paper/60">
                      {p.relation === 'referred' ? 'Joined through your referral' : 'Invited you'}
                      {p.hasAccess ? null : ' · must subscribe to the app before they can open it'}
                    </p>
                  </div>
                  <AddFriendButton listId={list.id} userId={p.id} name={p.displayName} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}

      <Panel>
        <h2 className="font-display text-lg font-semibold">Members</h2>
        <ul className="mt-3 divide-y divide-ink/10 dark:divide-paper/10">
          {list.members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between gap-3 py-2">
              <p>
                <span className="font-medium">{m.displayName}</span>
                {m.userId === user.id ? (
                  <span className="text-ink/50 dark:text-paper/50"> (you)</span>
                ) : null}
                {m.role === 'owner' ? (
                  <span className="ml-2 text-xs text-ink/50 dark:text-paper/50">owner</span>
                ) : null}
              </p>
              {m.role === 'member' && (isOwner || m.userId === user.id) ? (
                <RemoveMemberButton
                  listId={list.id}
                  userId={m.userId}
                  name={m.displayName}
                  leave={m.userId === user.id}
                />
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>

      {isOwner ? (
        <Panel>
          <h2 className="mb-3 font-display text-lg font-semibold">Settings</h2>
          <ListSettingsForm
            listId={list.id}
            name={list.name}
            currency={list.currency}
            shopDate={list.shopDate}
          />
        </Panel>
      ) : null}
    </div>
  );
}

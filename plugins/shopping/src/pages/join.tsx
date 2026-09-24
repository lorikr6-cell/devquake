import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { JoinButton } from '../components/home-forms';
import { pageScope } from '../components/guard';
import { Notice } from '../components/ui';
import { listByInvite, membership } from '../lib/data';
import { INVITE_CODE_PATTERN } from '../lib/model';

export const metadata = { title: 'Join a shopping list' };

export default async function Join({ params, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const code = (params.code ?? '').toUpperCase();
  const list = INVITE_CODE_PATTERN.test(code) ? await listByInvite(scope.db, code) : null;

  if (!list) {
    return (
      <Notice title="Invitation not valid">
        <p>This invite link was changed or never existed. Ask the list owner for a new one.</p>
        <p className="mt-3">
          <Link href="/" className="font-medium text-quake underline">
            Back to your lists
          </Link>
        </p>
      </Notice>
    );
  }
  if (await membership(scope.db, list.id, scope.user.id)) redirect(`/lists/${list.id}`);

  const members = Number(list.members);
  return (
    <Notice title={`Join “${list.name}”`}>
      <p>
        {list.owner} invited you to their shopping list ({members}{' '}
        {members === 1 ? 'member' : 'members'}). Everyone on the list can add items, stores and
        prices and tick things off while shopping.
      </p>
      <JoinButton code={code} />
    </Notice>
  );
}

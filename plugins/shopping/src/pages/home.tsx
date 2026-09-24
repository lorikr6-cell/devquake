import Link from 'next/link';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { CreateListForm, JoinForm } from '../components/home-forms';
import { pageScope } from '../components/guard';
import { Panel } from '../components/ui';
import { listsForUser } from '../lib/data';

export const metadata = { title: 'Shopping lists' };

export default async function Home({ ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const lists = await listsForUser(scope.db, scope.user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Your shopping lists</h1>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
          Shared carts for the people you shop with: stores, prices and totals in one place.
        </p>
      </div>

      {lists.length === 0 ? (
        <Panel>
          <p className="text-sm text-ink/70 dark:text-paper/70">
            No lists yet. Create one below, or join a friend&apos;s list with their invite code.
          </p>
        </Panel>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {lists.map((l) => (
            <li key={l.id}>
              <Link
                href={`/lists/${l.id}`}
                className="block rounded-xl border border-ink/10 bg-white/70 p-4 transition hover:border-quake dark:border-paper/10 dark:bg-paper/5"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-lg font-semibold">{l.name}</span>
                  {l.role === 'owner' ? (
                    <span className="text-xs text-ink/50 dark:text-paper/50">owner</span>
                  ) : null}
                </span>
                <span className="mt-1 block text-sm text-ink/60 dark:text-paper/60">
                  {Number(l.open)} to buy · {Number(l.done)} done · {Number(l.members)}{' '}
                  {Number(l.members) === 1 ? 'member' : 'members'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Panel>
          <h2 className="font-display text-lg font-semibold">New list</h2>
          <CreateListForm />
        </Panel>
        <Panel>
          <h2 className="font-display text-lg font-semibold">Join a list</h2>
          <JoinForm />
        </Panel>
      </div>
    </div>
  );
}

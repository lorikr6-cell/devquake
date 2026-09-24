import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { pageScope } from '../components/guard';
import { ListView } from '../components/list-view';
import { HttpError, refreshMemberName, snapshot } from '../lib/data';

export const metadata = { title: 'Shopping list' };

export default async function ListPage({ params, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const listId = Number(params.id);
  if (!Number.isSafeInteger(listId) || listId <= 0) notFound();

  const list = await snapshot(scope.db, listId, scope.user.id).catch((err) => {
    if (err instanceof HttpError) notFound();
    throw err;
  });
  await refreshMemberName(scope.db, listId, scope.user);
  return <ListView initial={list} />;
}

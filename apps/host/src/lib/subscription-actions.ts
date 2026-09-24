'use server';

import { refresh, revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSessionUser } from './auth/session';
import { getRequestInfo } from './request';
import { subscribe, unsubscribe } from './subscriptions';

/**
 * (Un)subscribe, then refresh the page in place (the card stays open where it is). A redirect to
 * the same page with only a #hash would not re-render it.
 */
export async function subscribeAction(projectId: number): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect('/#account');
  await subscribe(user, projectId, await getRequestInfo());
  revalidatePath('/');
  revalidatePath('/account');
  refresh();
}

export async function unsubscribeAction(projectId: number): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect('/#account');
  await unsubscribe(user, projectId, await getRequestInfo());
  revalidatePath('/');
  revalidatePath('/account');
  refresh();
}

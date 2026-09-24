'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSessionUser } from './auth/session';
import { getRequestInfo } from './request';
import { subscribe, unsubscribe } from './subscriptions';

/** Where to go back to after (un)subscribing: only our own pages, at the project's card. */
function backTo(form: FormData, projectId: number): string {
  return String(form.get('back') ?? '') === '/account'
    ? '/account#your-projects'
    : `/#project-${projectId}`;
}

export async function subscribeAction(projectId: number, form: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect('/#account');
  await subscribe(user, projectId, await getRequestInfo());
  revalidatePath('/');
  revalidatePath('/account');
  redirect(backTo(form, projectId));
}

export async function unsubscribeAction(projectId: number, form: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect('/#account');
  await unsubscribe(user, projectId, await getRequestInfo());
  revalidatePath('/');
  revalidatePath('/account');
  redirect(backTo(form, projectId));
}

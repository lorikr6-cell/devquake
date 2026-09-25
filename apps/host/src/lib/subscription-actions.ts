'use server';

import { refresh, revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSessionUser } from './auth/session';
import { getRequestInfo } from './request';
import { getT, localized } from '@/i18n/server';
import { subscribe, unsubscribe } from './subscriptions';

/**
 * (Un)subscribe, then refresh the page in place (the card stays open where it is). A redirect to
 * the same page with only a #hash would not re-render it.
 */
export async function subscribeAction(projectId: number): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect(`${await localized('/')}#account`);
  // 'not-enough-points' (e.g. spent in another tab): the refreshed card explains it.
  await subscribe(user, projectId, await getRequestInfo());
  revalidatePath('/');
  revalidatePath('/account');
  refresh();
}

export interface UnsubscribeState {
  error?: string;
}

/** Unsubscribe after the user confirmed the data loss (UnsubscribeButton). */
export async function unsubscribeAction(
  projectId: number,
  _prev: UnsubscribeState,
  _form: FormData,
): Promise<UnsubscribeState> {
  const user = await getSessionUser();
  const t = await getT('landing.actions');
  if (!user) return { error: t('pleaseSignIn') };
  const result = await unsubscribe(user, projectId, await getRequestInfo());
  if (result === 'error') {
    return { error: t('unsubscribeFailed') };
  }
  revalidatePath('/');
  revalidatePath('/account');
  refresh();
  return {};
}

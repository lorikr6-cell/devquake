'use server';

import { refresh, revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSessionUser } from './auth/session';
import { rateProject, toggleLike } from './project-feedback';
import { parseRating } from './project-feedback-rules';
import { getRequestInfo } from './request';

/** Like or un-like, then refresh the page in place so counts and the project order update. */
export async function toggleLikeAction(projectId: number): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect('/#account');
  await toggleLike(user, projectId, await getRequestInfo());
  revalidatePath('/');
  revalidatePath('/account');
  refresh();
}

export interface RateState {
  error?: string;
  saved?: boolean;
}

const RATE_ERRORS = {
  invalid: 'Pick between 1 and 5 stars for quality, usefulness or both.',
  not_found: 'This project is not available any more.',
  not_live: 'You can rate a project once its app is live.',
} as const;

export async function rateProjectAction(
  projectId: number,
  _prev: RateState,
  form: FormData,
): Promise<RateState> {
  const user = await getSessionUser();
  if (!user) return { error: 'Please sign in again.' };
  const quality = parseRating(form.get('quality'));
  const usefulness = parseRating(form.get('usefulness'));
  const result = await rateProject(user, projectId, quality, usefulness, await getRequestInfo());
  if (result !== 'ok') return { error: RATE_ERRORS[result] };
  revalidatePath('/');
  revalidatePath('/account');
  refresh();
  return { saved: true };
}

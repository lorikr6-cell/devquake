'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSessionUser } from './auth/session';
import { rateProject, toggleLike } from './project-feedback';
import { parseRating } from './project-feedback-rules';
import { getRequestInfo } from './request';

/** Back to the project's card on the page the form was on (only our own pages). */
function backTo(form: FormData, projectId: number): string {
  return String(form.get('back') ?? '') === '/account'
    ? `/account#project-${projectId}`
    : `/#project-${projectId}`;
}

export async function toggleLikeAction(projectId: number, form: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect('/#account');
  await toggleLike(user, projectId, await getRequestInfo());
  revalidatePath('/');
  revalidatePath('/account');
  redirect(backTo(form, projectId));
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
  return { saved: true };
}

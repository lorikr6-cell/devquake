'use server';

import { refresh, revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSessionUser } from './auth/session';
import { rateProject, toggleLike } from './project-feedback';
import { parseRating } from './project-feedback-rules';
import { getRequestInfo } from './request';
import { getT, localized } from '@/i18n/server';

/** Like or un-like, then refresh the page in place so counts and the project order update. */
export async function toggleLikeAction(projectId: number): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect(`${await localized('/')}#account`);
  await toggleLike(user, projectId, await getRequestInfo());
  revalidatePath('/');
  revalidatePath('/account');
  refresh();
}

export interface RateState {
  error?: string;
  saved?: boolean;
}

// Catalog keys under landing.feedback.errors (ADR 0011).
const RATE_ERRORS = { invalid: 'invalid', not_found: 'notFound', not_live: 'notLive' } as const;

export async function rateProjectAction(
  projectId: number,
  _prev: RateState,
  form: FormData,
): Promise<RateState> {
  const user = await getSessionUser();
  const t = await getT('landing');
  if (!user) return { error: t('actions.pleaseSignIn') };
  const quality = parseRating(form.get('quality'));
  const usefulness = parseRating(form.get('usefulness'));
  const result = await rateProject(user, projectId, quality, usefulness, await getRequestInfo());
  if (result !== 'ok') return { error: t(`feedback.errors.${RATE_ERRORS[result]}`) };
  revalidatePath('/');
  revalidatePath('/account');
  refresh();
  return { saved: true };
}

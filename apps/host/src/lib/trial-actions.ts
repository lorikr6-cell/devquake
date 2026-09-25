'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { localizePath } from '@devquake/ui';
import { getSessionUser } from './auth/session';
import { queryOne, type Row } from './db';
import { pluginUrl } from './domain';
import { getRequestInfo } from './request';
import { startTrial } from './trials';
import { getLocale, localized } from '@/i18n/server';

/**
 * "Try it for 24 hours" (ADR 0016), from a project card or from the app's access page. Starts
 * the member's one trial and opens the app. Without a trial (already used, subscribed, app
 * offline) the page is simply shown again and explains the state.
 */
export async function startTrialAction(projectId: number): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect(`${await localized('/')}#account`);
  const result = await startTrial(user, projectId, await getRequestInfo());
  revalidatePath('/');
  revalidatePath('/account');
  if (result !== 'ok' && result !== 'member') return;
  const project = await queryOne<Row & { plugin_id: string | null }>(
    'SELECT plugin_id FROM projects WHERE id = ?',
    [projectId],
  );
  if (!project?.plugin_id) return;
  const home = localizePath('/', await getLocale());
  redirect(`${pluginUrl(project.plugin_id)}${home === '/' ? '' : home}`);
}

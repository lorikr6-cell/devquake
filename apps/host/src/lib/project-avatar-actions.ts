'use server';

import { refresh, revalidatePath } from 'next/cache';
import { logActivity } from './activity';
import { getSessionUser } from './auth/session';
import { isHexColor, isProjectSymbol } from './project-avatar';
import { canEditProjectAvatar, saveAvatarChoice } from './project-avatars';
import { getRequestInfo } from './request';
import { getT } from '@/i18n/server';

export interface AvatarFormState {
  saved?: boolean;
  error?: string;
}

/**
 * Saves a project's logo colour and symbol ("auto" = automatic). For admins (in /admin-cp) and
 * for users who manage the project (on their account page).
 */
export async function saveProjectAvatarAction(
  projectId: number,
  _prev: AvatarFormState,
  form: FormData,
): Promise<AvatarFormState> {
  const user = await getSessionUser().catch(() => null);
  const t = await getT('account.logo');
  if (!user) return { error: t('signIn') };
  if (!(await canEditProjectAvatar(user, projectId))) return { error: t('notAllowed') };
  const colorValue = String(form.get('color_mode')) === 'auto' ? null : form.get('color');
  const symbolValue = form.get('symbol');
  if (colorValue !== null && !isHexColor(colorValue)) return { error: t('invalidColour') };
  if (symbolValue !== 'auto' && !isProjectSymbol(symbolValue)) {
    return { error: t('invalidSymbol') };
  }
  const choice = {
    color: colorValue === null ? null : colorValue.toUpperCase(),
    symbol: symbolValue === 'auto' ? null : (symbolValue as string),
  };
  try {
    await saveAvatarChoice(projectId, choice);
  } catch {
    return { error: t('failed') };
  }
  const info = await getRequestInfo();
  await logActivity({
    source: user.isAdmin ? 'admin-cp' : 'host',
    action: 'project.logo_updated',
    actorUserId: user.userId,
    entityType: 'project',
    entityId: projectId,
    ip: info.ip,
    userAgent: info.userAgent,
    metadata: { color: choice.color ?? 'auto', symbol: choice.symbol ?? 'auto' },
  });
  revalidatePath('/', 'layout');
  refresh();
  return { saved: true };
}

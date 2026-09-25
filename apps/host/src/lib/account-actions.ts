'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { deleteAccount } from './account-deletion';
import { getSessionUser, sessionCookieName } from './auth/session';
import { MAX_AVATAR_BYTES, removeAvatar, saveAvatar, sniffImageType } from './avatars';
import { sharedCookieDomain } from './domain';
import { getT, localized } from '@/i18n/server';

export interface AvatarState {
  error?: string;
}

export async function uploadAvatarAction(_prev: AvatarState, form: FormData): Promise<AvatarState> {
  const user = await getSessionUser();
  const t = await getT('account');
  if (!user) return { error: t('delete.errors.signIn') };
  const file = form.get('avatar');
  if (!(file instanceof File) || file.size === 0) return { error: t('avatar.chooseFirst') };
  if (file.size > MAX_AVATAR_BYTES) return { error: t('avatar.tooLarge') };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImageType(bytes);
  if (!mime) return { error: t('avatar.useFormat') };
  await saveAvatar(user.userId, bytes, mime);
  revalidatePath('/', 'layout');
  return {};
}

export async function removeAvatarAction(): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect(`${await localized('/')}#account`);
  await removeAvatar(user.userId);
  revalidatePath('/', 'layout');
}

export interface DeleteState {
  error?: string;
}

export async function deleteAccountAction(
  _prev: DeleteState,
  form: FormData,
): Promise<DeleteState> {
  const user = await getSessionUser();
  if (!user) redirect(`${await localized('/')}#account`);
  const t = await getT('account.delete.errors');
  if (String(form.get('confirm') ?? '').trim() !== 'DELETE') {
    return { error: t('confirmWord') };
  }
  const result = await deleteAccount(user);
  if (!result.ok) {
    return {
      error: result.error === 'owner' ? t('onlyOwner') : t('failed'),
    };
  }
  // Sessions are gone with the user; clear the browser's cookie too.
  (await cookies()).delete({ name: sessionCookieName(), path: '/', domain: sharedCookieDomain() });
  redirect(`${await localized('/')}?deleted=1`);
}

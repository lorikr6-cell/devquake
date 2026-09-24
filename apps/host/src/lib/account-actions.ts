'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { deleteAccount } from './account-deletion';
import { getSessionUser, sessionCookieName } from './auth/session';
import { MAX_AVATAR_BYTES, removeAvatar, saveAvatar, sniffImageType } from './avatars';
import { sharedCookieDomain } from './domain';

export interface AvatarState {
  error?: string;
}

export async function uploadAvatarAction(_prev: AvatarState, form: FormData): Promise<AvatarState> {
  const user = await getSessionUser();
  if (!user) return { error: 'Please sign in again.' };
  const file = form.get('avatar');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose an image first.' };
  if (file.size > MAX_AVATAR_BYTES) return { error: 'That image is too large (max 512 KB).' };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImageType(bytes);
  if (!mime) return { error: 'Use a PNG, JPEG or WebP image.' };
  await saveAvatar(user.userId, bytes, mime);
  revalidatePath('/', 'layout');
  return {};
}

export async function removeAvatarAction(): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect('/#account');
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
  if (!user) redirect('/#account');
  if (String(form.get('confirm') ?? '').trim() !== 'DELETE') {
    return { error: 'Type DELETE in capital letters to confirm.' };
  }
  const result = await deleteAccount(user);
  if (!result.ok) {
    return {
      error: 'The owner account cannot be deleted here, or you would lose access to the site.',
    };
  }
  // Sessions are gone with the user; clear the browser's cookie too.
  (await cookies()).delete({ name: sessionCookieName(), path: '/', domain: sharedCookieDomain() });
  redirect('/?deleted=1');
}

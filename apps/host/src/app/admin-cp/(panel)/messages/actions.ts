'use server';

import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/activity';
import { ADMIN_BASE, requireOwner } from '@/lib/auth/admin';
import {
  MESSAGE_STATUSES,
  deleteMessage,
  replyToMessage,
  setMessageStatus,
  type MessageStatus,
} from '@/lib/contact';

export async function setMessageStatusAction(id: number, form: FormData): Promise<void> {
  const owner = await requireOwner();
  const status = String(form.get('status'));
  if (!(MESSAGE_STATUSES as readonly string[]).includes(status)) return;
  await setMessageStatus(id, status as MessageStatus);
  await logActivity({
    source: 'admin-cp',
    action: 'contact.status_changed',
    message: status,
    actorUserId: owner.userId,
    entityType: 'contact_message',
    entityId: id,
  });
  revalidatePath(ADMIN_BASE, 'layout');
}

export interface ReplyState {
  sent?: boolean;
  emailed?: boolean;
  error?: string;
}

/** Answers a message: saved for the member's account and emailed to the sender. */
export async function replyAction(
  id: number,
  _prev: ReplyState,
  form: FormData,
): Promise<ReplyState> {
  const owner = await requireOwner();
  const body = String(form.get('body') ?? '')
    .trim()
    .slice(0, 5000);
  if (body.length < 2) return { error: 'Write a reply first.' };
  let result: { emailed: boolean } | null;
  try {
    result = await replyToMessage(id, owner.userId, body);
  } catch {
    return { error: 'The reply could not be saved. Is database migration 0015 imported?' };
  }
  if (!result) return { error: 'This message no longer exists.' };
  await logActivity({
    source: 'admin-cp',
    action: 'contact.replied',
    message: result.emailed ? 'emailed' : 'email not sent',
    actorUserId: owner.userId,
    entityType: 'contact_message',
    entityId: id,
  });
  revalidatePath(ADMIN_BASE, 'layout');
  return { sent: true, emailed: result.emailed };
}

export async function deleteMessageAction(id: number): Promise<void> {
  const owner = await requireOwner();
  if (await deleteMessage(id)) {
    await logActivity({
      source: 'admin-cp',
      action: 'contact.deleted',
      message: 'by the owner',
      actorUserId: owner.userId,
      entityType: 'contact_message',
      entityId: id,
    });
  }
  revalidatePath(ADMIN_BASE, 'layout');
}

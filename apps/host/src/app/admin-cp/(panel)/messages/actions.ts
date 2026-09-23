'use server';

import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/activity';
import { ADMIN_BASE, requireOwner } from '@/lib/auth/admin';
import { MESSAGE_STATUSES, setMessageStatus, type MessageStatus } from '@/lib/contact';

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

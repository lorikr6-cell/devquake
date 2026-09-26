'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logActivity } from '@/lib/activity';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { parseReferralForm } from '@/lib/external-referral-rules';
import { deleteReferral, saveReferral } from '@/lib/external-referrals';
import { getRequestInfo } from '@/lib/request';

async function audit(action: string, userId: number, id: number, message: string) {
  const info = await getRequestInfo();
  await logActivity({
    source: 'admin-cp',
    action,
    message,
    actorUserId: userId,
    entityType: 'referral',
    entityId: id,
    ip: info.ip,
    userAgent: info.userAgent,
  });
}

/** Creates (id null) or saves an external referral (ADR 0021). */
export async function saveReferralAction(id: number | null, form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const back = id ? `${ADMIN_BASE}/referrals/${id}` : `${ADMIN_BASE}/referrals/new`;
  const parsed = parseReferralForm(form);
  if (!parsed.ok) redirect(`${back}?error=${parsed.error}`);
  const result = await saveReferral(id, parsed.value);
  if (!result.ok) redirect(`${back}?error=duplicate`);
  await audit(
    id ? 'referral.updated' : 'referral.created',
    admin.userId,
    result.id,
    parsed.value.name,
  );
  revalidatePath('/', 'layout');
  redirect(`${ADMIN_BASE}/referrals/${result.id}?saved=1`);
}

export async function deleteReferralAction(id: number): Promise<void> {
  const admin = await requireAdmin();
  await deleteReferral(id);
  await audit('referral.deleted', admin.userId, id, String(id));
  revalidatePath('/', 'layout');
  redirect(`${ADMIN_BASE}/referrals`);
}

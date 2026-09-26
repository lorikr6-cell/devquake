'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logActivity } from '@/lib/activity';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { checkLogo, LOGO_MAX_BYTES, parseReferralForm } from '@/lib/external-referral-rules';
import { deleteReferral, saveReferral, type LogoChange } from '@/lib/external-referrals';
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
  // The logo: kept unless a new file is chosen or "remove" is ticked.
  let logo: LogoChange = { kind: 'keep' };
  const file = form.get('logo');
  if (form.get('remove_logo') === 'on') logo = { kind: 'remove' };
  else if (file instanceof File && file.size > 0) {
    if (file.size > LOGO_MAX_BYTES) redirect(`${back}?error=logo`);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = checkLogo(bytes);
    if (!type) redirect(`${back}?error=logo`);
    logo = { kind: 'set', data: Buffer.from(bytes), type };
  }
  const result = await saveReferral(id, parsed.value, logo);
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

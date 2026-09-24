'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { removeUsersAsOwner, type RemovalReport } from '@/lib/account-deletion';
import { ADMIN_BASE, requireOwner } from '@/lib/auth/admin';
import { getUser } from '@/lib/admin/users';

export interface RemoveState {
  error?: string;
  report?: RemovalReport;
}

const REASONS: Record<RemovalReport['skipped'][number]['reason'], string> = {
  owner: 'the owner account cannot be removed',
  self: 'you cannot remove your own account here',
  missing: 'already removed',
  plugins: 'an app could not delete its data; try again later',
};

export async function describeSkipped(report: RemovalReport): Promise<string[]> {
  return report.skipped.map((s) => `#${s.userId}: ${REASONS[s.reason]}`);
}

/**
 * Removes the selected users (Users list, "Delete selected"). Owner only; the owner must type
 * DELETE. Each account is deleted completely (like a self-service deletion) and emailed.
 */
export async function removeSelectedUsersAction(
  _prev: RemoveState,
  form: FormData,
): Promise<RemoveState> {
  const owner = await requireOwner();
  if (String(form.get('confirm') ?? '').trim() !== 'DELETE') {
    return { error: 'Type DELETE in capital letters to confirm.' };
  }
  const ids = form
    .getAll('ids')
    .map((v) => Number(v))
    .filter((n) => Number.isSafeInteger(n) && n > 0);
  if (ids.length === 0) return { error: 'Select at least one user.' };
  const report = await removeUsersAsOwner(owner, ids);
  revalidatePath(`${ADMIN_BASE}/users`);
  return { report };
}

/** Removes one user from their page. The owner confirms by typing the user's email address. */
export async function removeUserAction(
  userId: number,
  _prev: RemoveState,
  form: FormData,
): Promise<RemoveState> {
  const owner = await requireOwner();
  // The address to type comes from the database, never from the page.
  const user = await getUser(userId);
  if (!user) return { error: 'This user no longer exists.' };
  const email = user.email;
  if (
    String(form.get('confirm') ?? '')
      .trim()
      .toLowerCase() !== email.toLowerCase()
  ) {
    return { error: 'Type the user’s email address exactly to confirm.' };
  }
  const report = await removeUsersAsOwner(owner, [userId]);
  if (report.removed !== 1) {
    const [reason] = await describeSkipped(report);
    return { error: `Not removed: ${reason?.replace(/^#\d+: /, '') ?? 'unknown error'}.` };
  }
  revalidatePath(`${ADMIN_BASE}/users`);
  redirect(`${ADMIN_BASE}/users?removed=1`);
}

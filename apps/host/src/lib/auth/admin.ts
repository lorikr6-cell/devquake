import 'server-only';
import { redirect } from 'next/navigation';
import { getSessionUser, type SessionUser } from './session';
import { localized } from '@/i18n/server';

/** Base path of the admin control panel. It is never linked from the public site. */
export const ADMIN_BASE = '/admin-cp';

/**
 * Guards for pages and server actions. Call them in every page AND every action, not only in
 * the layout: layouts do not re-run on client navigation, and actions can be invoked directly.
 */

/** Owner or admin: may use /admin-cp (dashboard, ideas, projects). */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user?.isAdmin) redirect(ADMIN_BASE);
  return user;
}

/** Owner only: users, statistics and the activity log. Admins get the dashboard instead. */
export async function requireOwner(): Promise<SessionUser> {
  const user = await requireAdmin();
  if (!user.isOwner) redirect(`${ADMIN_BASE}/dashboard`);
  return user;
}

/** Any signed-in user (public account pages). */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`${await localized('/')}#account`);
  return user;
}

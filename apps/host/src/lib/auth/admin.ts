import 'server-only';
import { redirect } from 'next/navigation';
import { getSessionUser, type SessionUser } from './session';

/** Base path of the admin control panel. It is never linked from the public site. */
export const ADMIN_BASE = '/admin-cp';

/**
 * Guard for every admin page and server action. Redirects to the login page unless the
 * request carries a valid session of a user with the platform.admin role.
 * Call it in each page and action, not only in the layout: layouts do not re-run on
 * client navigation, and server actions can be invoked directly.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user?.isAdmin) redirect(ADMIN_BASE);
  return user;
}

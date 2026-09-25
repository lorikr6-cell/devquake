import 'server-only';
import { cookies } from 'next/headers';
import { SIDENAV_COOKIE } from './side-nav';

/** Whether the visitor collapsed the sidebar (account dashboard and /admin-cp). */
export async function isSideNavCollapsed(): Promise<boolean> {
  return (await cookies()).get(SIDENAV_COOKIE)?.value === 'collapsed';
}

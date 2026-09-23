'use server';

import { redirect } from 'next/navigation';
import { logActivity } from '@/lib/activity';
import { ADMIN_BASE } from '@/lib/auth/admin';
import { loginAdmin } from '@/lib/auth/login';
import { destroySession, getSessionUser } from '@/lib/auth/session';
import { getRequestInfo } from '@/lib/request';

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  if (!email || !password || email.length > 254 || password.length > 256) {
    return { error: 'Invalid email or password.' };
  }

  let result;
  try {
    result = await loginAdmin(email, password, await getRequestInfo());
  } catch (err) {
    console.error('[admin-cp] login error', err);
    return { error: 'Sign-in is temporarily unavailable.' };
  }

  if (!result.ok) {
    return {
      error:
        result.reason === 'throttled'
          ? 'Too many attempts. Try again in a few minutes.'
          : 'Invalid email or password.',
    };
  }
  redirect(`${ADMIN_BASE}/dashboard`);
}

export async function logoutAction(): Promise<void> {
  const user = await getSessionUser();
  await destroySession();
  if (user) {
    const info = await getRequestInfo();
    await logActivity({
      source: 'admin-cp',
      level: 'security',
      action: 'auth.logout',
      actorUserId: user.userId,
      ip: info.ip,
      userAgent: info.userAgent,
    });
  }
  redirect(ADMIN_BASE);
}

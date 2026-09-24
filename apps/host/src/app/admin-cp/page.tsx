import { redirect } from 'next/navigation';
import { DevQuakeLogo } from '@devquake/ui';
import { ThemePicker } from '@/components/theme-picker';
import { sharedCookieDomain } from '@/lib/domain';
import { getTheme } from '@/lib/theme-server';
import { ADMIN_BASE } from '@/lib/auth/admin';
import { getSessionUser } from '@/lib/auth/session';
import { LoginForm } from './login-form';

export const metadata = { title: 'Sign in' };

export default async function AdminLoginPage() {
  const user = await getSessionUser().catch(() => null);
  if (user?.isAdmin) redirect(`${ADMIN_BASE}/dashboard`);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-16">
      <div className="fixed top-4 right-4">
        <ThemePicker initial={await getTheme()} cookieDomain={sharedCookieDomain()} />
      </div>
      <div className="mb-8 flex justify-center">
        <DevQuakeLogo size={44} />
      </div>
      <section className="rounded-lg border border-ink/10 border-t-4 border-t-quake bg-white p-6 shadow-sm dark:border-paper/10 dark:border-t-quake dark:bg-paper/5">
        <h1 className="font-display text-2xl tracking-tight">Control panel</h1>
        <p className="mt-1 mb-6 text-sm text-ink/60 dark:text-paper/60">
          Sign in with your admin account.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}

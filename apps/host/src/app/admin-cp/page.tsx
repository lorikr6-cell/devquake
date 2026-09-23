import { redirect } from 'next/navigation';
import { Card } from '@devquake/ui';
import { ADMIN_BASE } from '@/lib/auth/admin';
import { getSessionUser } from '@/lib/auth/session';
import { LoginForm } from './login-form';

export const metadata = { title: 'Sign in' };

export default async function AdminLoginPage() {
  const user = await getSessionUser().catch(() => null);
  if (user?.isAdmin) redirect(`${ADMIN_BASE}/dashboard`);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-16">
      <Card className="bg-white dark:bg-zinc-900">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-1 mb-6 text-sm text-zinc-600 dark:text-zinc-400">DevQuake control panel</p>
        <LoginForm />
      </Card>
    </main>
  );
}

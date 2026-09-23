import Link from 'next/link';
import { DevQuakeLogo } from '@devquake/ui';
import { VerifyForm } from '@/components/auth/verify-form';
import { ADMIN_BASE } from '@/lib/auth/admin';
import { CODE_TTL_MINUTES, getPendingChallenge, maskEmail } from '@/lib/auth/flow';

export const metadata = { title: 'Enter your code' };

export default async function AdminVerifyPage() {
  const challenge = await getPendingChallenge().catch(() => null);
  const valid = challenge?.purpose === 'admin';

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-16">
      <div className="mb-8 flex justify-center">
        <DevQuakeLogo size={44} />
      </div>
      <section className="rounded-lg border border-ink/10 border-t-4 border-t-quake bg-white p-6 shadow-sm dark:border-paper/10 dark:border-t-quake dark:bg-paper/5">
        <h1 className="font-display text-2xl tracking-tight">Check your email</h1>
        {valid ? (
          <>
            <p className="mt-2 mb-6 text-sm text-ink/70 dark:text-paper/70">
              Enter the code we sent to <strong>{maskEmail(challenge.email)}</strong>. It expires in{' '}
              {CODE_TTL_MINUTES} minutes.
            </p>
            <VerifyForm />
          </>
        ) : (
          <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">
            This sign-in has expired.{' '}
            <Link href={ADMIN_BASE} className="underline decoration-quake underline-offset-2">
              Sign in again
            </Link>
            .
          </p>
        )}
      </section>
    </main>
  );
}

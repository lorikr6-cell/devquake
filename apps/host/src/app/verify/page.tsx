import { VerifyForm } from '@/components/auth/verify-form';
import { SiteFooter } from '@/components/site-footer';
import { SectionLink } from '@/components/section-link';
import { SiteHeader } from '@/components/site-header';
import { CODE_TTL_MINUTES, getPendingChallenge, maskEmail } from '@/lib/auth/flow';

export const metadata = { title: 'Enter your code', robots: { index: false } };

export default async function VerifyPage() {
  const challenge = await getPendingChallenge().catch(() => null);

  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      <SiteHeader />
      <main className="mx-auto max-w-sm px-4 py-16">
        <section className="rounded-lg border border-ink/10 border-t-4 border-t-quake bg-white p-6 shadow-sm dark:border-paper/10 dark:border-t-quake dark:bg-paper/5">
          <h1 className="font-display text-2xl tracking-tight">Check your email</h1>
          {challenge ? (
            <>
              <p className="mt-2 mb-6 text-sm text-ink/70 dark:text-paper/70">
                {challenge.purpose === 'signup'
                  ? 'To confirm your address, enter'
                  : 'To finish signing in, enter'}{' '}
                the code we sent to <strong>{maskEmail(challenge.email)}</strong>. It expires in{' '}
                {CODE_TTL_MINUTES} minutes.
              </p>
              <VerifyForm />
            </>
          ) : (
            <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">
              There is no sign-in waiting for a code in this browser, or it has expired.{' '}
              <SectionLink
                href="/#account"
                tab="signin"
                className="underline decoration-quake underline-offset-2"
              >
                Sign in again
              </SectionLink>
              .
            </p>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

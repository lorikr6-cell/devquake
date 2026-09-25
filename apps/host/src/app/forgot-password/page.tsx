import { ForgotPasswordForm } from '@/components/auth/password-reset-forms';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { RESET_TTL_MINUTES } from '@/lib/auth/password-reset';
import { getT } from '@/i18n/server';

export async function generateMetadata() {
  return { title: (await getT('auth.forgot'))('metaTitle'), robots: { index: false } };
}

/** "Forgot your password?" from the sign-in card (ADR 0017). */
export default async function ForgotPasswordPage() {
  const t = await getT('auth.forgot');
  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      <SiteHeader />
      <main className="mx-auto max-w-sm px-4 py-16">
        <section className="rounded-lg border border-ink/10 border-t-4 border-t-quake bg-white p-6 shadow-sm dark:border-paper/10 dark:border-t-quake dark:bg-paper/5">
          <h1 className="font-display text-2xl tracking-tight">{t('title')}</h1>
          <p className="mt-2 mb-6 text-sm text-ink/70 dark:text-paper/70">
            {t('intro', { minutes: RESET_TTL_MINUTES })}
          </p>
          <ForgotPasswordForm minutes={RESET_TTL_MINUTES} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

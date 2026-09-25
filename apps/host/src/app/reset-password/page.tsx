import { Link } from '@devquake/ui';
import { ResetPasswordForm } from '@/components/auth/password-reset-forms';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { RESET_TTL_MINUTES, resetLinkState, resetTokenFromCookie } from '@/lib/auth/password-reset';
import { getT } from '@/i18n/server';

export async function generateMetadata() {
  return { title: (await getT('auth.reset'))('metaTitle'), robots: { index: false } };
}

/**
 * Choose a new password after opening the emailed link (/password-reset stored its token in a
 * cookie), or learn that the link has expired or was already used. Viewing does not use it.
 */
export default async function ResetPasswordPage() {
  const token = await resetTokenFromCookie();
  const t = await getT('auth.reset');
  const state = await resetLinkState(token).catch(() => 'invalid' as const);
  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      <SiteHeader />
      <main className="mx-auto max-w-sm px-4 py-16">
        <section className="rounded-lg border border-ink/10 border-t-4 border-t-quake bg-white p-6 shadow-sm dark:border-paper/10 dark:border-t-quake dark:bg-paper/5">
          <h1 className="font-display text-2xl tracking-tight">{t('title')}</h1>
          {state === 'valid' ? (
            <>
              <p className="mt-2 mb-6 text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
              <ResetPasswordForm />
            </>
          ) : (
            <>
              <p role="alert" className="mt-2 text-sm text-ink/80 dark:text-paper/80">
                {state === 'expired' ? t('expired', { minutes: RESET_TTL_MINUTES }) : t('invalid')}
              </p>
              <Link
                href="/forgot-password"
                className="mt-4 inline-block font-medium underline decoration-quake/50 underline-offset-2 hover:decoration-quake"
              >
                {t('requestNew')}
              </Link>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

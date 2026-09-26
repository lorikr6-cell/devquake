import { buttonClass, Card, Link, rich } from '@devquake/ui';
import { getLocale, getT } from '@/i18n/server';
import { hostUrl } from '@/lib/domain';
import { languageAlternates } from '@/lib/seo-languages';
import { AuthCard, type AuthNotice } from '@/components/auth/auth-card';
import { ContactForm } from '@/components/contact-form';
import { SectionLink } from '@/components/section-link';
import { HOSTINGER_REFERRAL_URL } from '@/components/site-footer';
import { HOSTINGER_SLUG } from '@/lib/partners';
import { PlatformShell } from '@/components/account/account-shell';
import { ProjectActions } from '@/components/landing/project-actions';
import {
  ExternalReferrals,
  REFERRAL_BOX,
  REFERRAL_DISCLOSURE,
  REFERRAL_ROW,
  REFERRAL_TEXT,
  ReferralHeading,
  ReferralQr,
} from '@/components/landing/external-referrals';
import { ProjectCard } from '@/components/landing/project-card';
import { ProjectFeedback } from '@/components/landing/project-feedback';
import { PublicStatsSection } from '@/components/landing/public-stats';
import { SiteQr } from '@/components/landing/site-qr';
import { getSessionUser } from '@/lib/auth/session';
import { CONTACT_EMAIL } from '@/lib/legal';
import { myFeedback } from '@/lib/project-feedback';
import type { MyFeedback } from '@/lib/project-feedback-rules';
import { listPublicProjects } from '@/lib/public-projects';
import { cookies } from 'next/headers';
import { REF_COOKIE, getNps, inviterByCode } from '@/lib/referrals';
import { getMemberships } from '@/lib/subscriptions';
import { getPublicStats } from '@/lib/visits';
import { emailLinkClass } from '@/components/form-styles';
import { redirect } from 'next/navigation';
import { safeReturnUrl } from '@/lib/return-url';

export async function generateMetadata() {
  const t = await getT('landing');
  // Absolute title: the landing page is the site itself, not "… · DevQuake".
  return {
    title: { absolute: t('metaTitle') },
    alternates: languageAlternates(hostUrl(), '/', await getLocale()),
  };
}

// Outcome of an activation link (?activation=...), as catalog keys under auth.notices.
const ACTIVATION_NOTICES: Record<string, { tone: AuthNotice['tone']; key: string }> = {
  ok: { tone: 'success', key: 'activated' },
  already: { tone: 'success', key: 'alreadyActive' },
  expired: { tone: 'error', key: 'activationExpired' },
  invalid: { tone: 'error', key: 'activationInvalid' },
};

type Props = {
  searchParams: Promise<{
    activation?: string;
    deleted?: string;
    next?: string;
    reset?: string;
  }>;
};

export default async function HomePage({ searchParams }: Props) {
  const { activation, deleted, next, reset } = await searchParams;
  const [t, tAuth] = await Promise.all([getT('landing'), getT('auth')]);
  const activationNotice = activation ? ACTIVATION_NOTICES[activation] : undefined;
  // Came from an app (e.g. shopping.devquake.com) that needs a signed-in visitor.
  const returnTo = safeReturnUrl(next) ?? undefined;
  const notice: AuthNotice | undefined = deleted
    ? { tone: 'success', text: tAuth('notices.deleted') }
    : reset === 'ok'
      ? { tone: 'success', text: tAuth('notices.passwordReset') }
      : activationNotice
        ? { tone: activationNotice.tone, text: tAuth(`notices.${activationNotice.key}`) }
        : undefined;
  // The page still renders (without these sections) if the database is unavailable.
  const [user, projects, stats] = await Promise.all([
    getSessionUser().catch(() => null),
    listPublicProjects().catch(() => null),
    getPublicStats().catch(() => null),
  ]);
  if (user && returnTo) redirect(returnTo);
  // Available NPS points next to the name (ADR 0012).
  const nps = user ? await getNps(user.userId).catch(() => null) : null;
  // Came through someone's invite link (/r/<code>): name the inviter on "Create account".
  const inviter = user
    ? null
    : await inviterByCode((await cookies()).get(REF_COOKIE)?.value).catch(() => null);
  const memberships = user
    ? await getMemberships(user.userId).catch(() => new Map<number, 'subscribed' | 'assigned'>())
    : new Map<number, 'subscribed' | 'assigned'>();
  const feedback = user
    ? await myFeedback(user.userId).catch(() => new Map<number, MyFeedback>())
    : new Map<number, MyFeedback>();

  return (
    <PlatformShell width="max-w-5xl" mainClassName="py-14">
      <section className="grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="md:pt-6">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{t('hero.title')}</h1>
          <p className="mt-4 max-w-prose text-ink/80 dark:text-paper/80">{t('hero.intro')}</p>
          <p className="mt-3 max-w-prose text-ink/70 dark:text-paper/70">
            {rich(t('hero.subdomains'), {
              link: (
                <SectionLink
                  href="/#contact"
                  className="underline decoration-quake underline-offset-2"
                >
                  {t('hero.tellUs')}
                </SectionLink>
              ),
            })}
          </p>
          <SiteQr />
        </div>

        <div id="account" className="scroll-mt-24">
          {user ? (
            <Card className="bg-white dark:bg-paper/5">
              <p className="text-sm text-ink/60 dark:text-paper/60">{t('hero.signedInAs')}</p>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-semibold">{user.displayName}</span>
                {nps !== null ? (
                  <Link
                    href="/account#nps"
                    title={t('hero.npsTitle')}
                    className="rounded-full bg-quake/10 px-2 py-0.5 text-xs font-semibold text-ink tabular-nums hover:bg-quake/20 dark:bg-quake/20 dark:text-paper dark:hover:bg-quake/30"
                  >
                    {t('hero.npsPoints', { count: nps })}
                  </Link>
                ) : null}
              </p>
              <Link href="/account" className={buttonClass('primary', 'mt-4')}>
                {t('hero.yourAccount')}
              </Link>
            </Card>
          ) : (
            <AuthCard
              notice={
                notice ??
                (returnTo
                  ? {
                      tone: 'success',
                      text: tAuth('continueTo', { site: new URL(returnTo).host }),
                    }
                  : undefined)
              }
              invitedBy={inviter?.display_name}
              returnTo={returnTo}
            />
          )}
        </div>
      </section>

      {stats && <PublicStatsSection stats={stats} />}

      {projects && (
        <section id="projects" aria-labelledby="projects-title" className="mt-20 scroll-mt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="projects-title" className="font-display text-2xl tracking-tight">
              {t('projects.title')}
            </h2>
            <p className="text-sm text-ink/60 dark:text-paper/60">{t('projects.hint')}</p>
          </div>
          {projects.length === 0 ? (
            <p className="mt-4 text-ink/70 dark:text-paper/70">{t('projects.none')}</p>
          ) : (
            <div className="mt-4 grid items-start gap-4 md:grid-cols-2">
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  id={`project-${p.id}`}
                  project={p}
                  membership={memberships.get(p.id)}
                  footer={
                    <ProjectActions project={p} user={user} membership={memberships.get(p.id)} />
                  }
                  feedback={<ProjectFeedback project={p} user={user} mine={feedback.get(p.id)} />}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <section
        id="ideas"
        className="mt-14 flex scroll-mt-24 flex-wrap items-center justify-between gap-4 rounded-lg border border-quake/30 bg-quake/5 p-5"
      >
        <div className="max-w-prose">
          <h2 className="font-display text-xl tracking-tight">{t('ideasCta.title')}</h2>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('ideasCta.body')}</p>
        </div>
        <Link href="/ideas" className={buttonClass()}>
          {user ? t('ideasCta.signedIn') : t('ideasCta.signedOut')}
        </Link>
      </section>

      <section
        id="contact"
        className="mt-20 grid scroll-mt-24 gap-10 border-t border-ink/10 pt-14 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] dark:border-paper/10"
      >
        <div>
          <h2 className="font-display text-3xl tracking-tight">{t('contact.title')}</h2>
          <p className="mt-3 max-w-prose text-ink/70 dark:text-paper/70">{t('contact.body')}</p>
          <p className="mt-4 text-sm">
            {t('contact.preferEmail')}{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className={emailLinkClass}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm dark:border-paper/10 dark:bg-paper/5">
          <ContactForm sender={user ? { name: user.displayName, email: user.email } : undefined} />
        </div>
      </section>

      {/* Partner offers, apart from the contact form: Hostinger and /admin-cp/referrals (ADR 0021). */}
      <section
        id="partners"
        aria-labelledby="partners-title"
        className="mt-16 scroll-mt-24 border-t border-ink/10 pt-12 dark:border-paper/10"
      >
        <h2 id="partners-title" className="font-display text-2xl tracking-tight">
          {t('partners.title')}
        </h2>
        <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">{t('partners.body')}</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <aside className={REFERRAL_BOX}>
            <ReferralHeading
              label={t('contact.hostingLabel')}
              title={t('contact.hostingTitle')}
              logoUrl="/partners/hostinger.svg"
              logoAlt={t('referrals.logoLabel', { name: 'Hostinger' })}
            />
            <div className={REFERRAL_ROW}>
              <div className={REFERRAL_TEXT}>
                <p className="text-sm text-ink/70 dark:text-paper/70">{t('contact.hostingBody')}</p>
                <a
                  href={HOSTINGER_REFERRAL_URL}
                  target="_blank"
                  rel="sponsored noopener"
                  className="mt-4 inline-flex items-center gap-2 self-start rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none dark:bg-paper dark:text-ink dark:hover:bg-paper/85"
                >
                  {t('contact.hostingButton')}
                  <span aria-hidden="true">→</span>
                </a>
              </div>
              <ReferralQr slug={HOSTINGER_SLUG} name="Hostinger" />
            </div>
            <p className={REFERRAL_DISCLOSURE}>hostinger.com · {t('contact.referral')}</p>
          </aside>
          <ExternalReferrals />
        </div>
      </section>
    </PlatformShell>
  );
}

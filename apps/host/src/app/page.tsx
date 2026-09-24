import Link from 'next/link';
import { Card } from '@devquake/ui';
import { AuthCard, type AuthNotice } from '@/components/auth/auth-card';
import { ContactForm } from '@/components/contact-form';
import { SectionLink } from '@/components/section-link';
import { HOSTINGER_REFERRAL_URL, SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { ProjectActions } from '@/components/landing/project-actions';
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
import { REF_COOKIE, inviterByCode } from '@/lib/referrals';
import { getMemberships } from '@/lib/subscriptions';
import { getPublicStats } from '@/lib/visits';
import { emailLinkClass } from '@/components/form-styles';
import { redirect } from 'next/navigation';
import { safeReturnUrl } from '@/lib/return-url';

export const metadata = {
  // Absolute title: the landing page is the site itself, not "… · DevQuake".
  title: { absolute: 'DevQuake · A developer’s workshop for everyday problems' },
  alternates: { canonical: '/' },
};

const ACTIVATION_NOTICES: Record<string, AuthNotice> = {
  ok: { tone: 'success', text: 'Your account is active. Sign in to continue.' },
  already: { tone: 'success', text: 'Your account is already active. Sign in to continue.' },
  expired: {
    tone: 'error',
    text: 'This activation link has expired. Sign in with your email and password and we will send you a new one.',
  },
  invalid: {
    tone: 'error',
    text: 'This activation link is not valid. Sign in with your email and password to get a new one.',
  },
};

type Props = {
  searchParams: Promise<{ activation?: string; deleted?: string; next?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const { activation, deleted, next } = await searchParams;
  // Came from an app (e.g. shopping.devquake.com) that needs a signed-in visitor.
  const returnTo = safeReturnUrl(next) ?? undefined;
  const notice: AuthNotice | undefined = deleted
    ? {
        tone: 'success',
        text: 'Your account and your personal data were deleted. Goodbye, and you are always welcome back.',
      }
    : activation
      ? ACTIVATION_NOTICES[activation]
      : undefined;
  // The page still renders (without these sections) if the database is unavailable.
  const [user, projects, stats] = await Promise.all([
    getSessionUser().catch(() => null),
    listPublicProjects().catch(() => null),
    getPublicStats().catch(() => null),
  ]);
  if (user && returnTo) redirect(returnTo);
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
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-14">
        <section className="grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
          <div className="md:pt-6">
            <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
              A developer’s workshop for everyday problems.
            </h1>
            <p className="mt-4 max-w-prose text-ink/80 dark:text-paper/80">
              DevQuake is a personal, non-commercial website for building web applications that
              serve real needs. It started as a way to solve a developer’s own daily struggles, one
              small app at a time, and every app is open to anyone who finds it useful for their own
              projects, or who needs a similar problem solved or managed.
            </p>
            <p className="mt-3 max-w-prose text-ink/70 dark:text-paper/70">
              Each app lives on its own subdomain and one account signs you in to all of them. Have
              an idea or a problem worth solving?{' '}
              <SectionLink
                href="/#contact"
                className="underline decoration-quake underline-offset-2"
              >
                Tell us about it
              </SectionLink>
              .
            </p>
            <SiteQr />
          </div>

          <div id="account" className="scroll-mt-24">
            {user ? (
              <Card className="bg-white dark:bg-paper/5">
                <p className="text-sm text-ink/60 dark:text-paper/60">Signed in as</p>
                <p className="mt-1 font-semibold">{user.displayName}</p>
                <Link
                  href="/account"
                  className="mt-4 inline-block rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/85 dark:bg-paper dark:hover:bg-paper/85 dark:text-ink"
                >
                  Your account
                </Link>
              </Card>
            ) : (
              <AuthCard
                notice={
                  notice ??
                  (returnTo
                    ? {
                        tone: 'success',
                        text: `Sign in to continue to ${new URL(returnTo).host}.`,
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
                Projects and progress
              </h2>
              <p className="text-sm text-ink/60 dark:text-paper/60">
                Open a project to see its scope and milestones.
              </p>
            </div>
            {projects.length === 0 ? (
              <p className="mt-4 text-ink/70 dark:text-paper/70">
                The first projects are on their way.
              </p>
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
          id="contact"
          className="mt-20 grid scroll-mt-24 gap-10 border-t border-ink/10 pt-14 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] dark:border-paper/10"
        >
          <div>
            <h2 className="font-display text-3xl tracking-tight">Get in touch</h2>
            <p className="mt-3 max-w-prose text-ink/70 dark:text-paper/70">
              Questions, ideas for a new app, or found a bug? Send us a message and we will reply by
              email.
            </p>
            <p className="mt-4 text-sm">
              Prefer email?{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className={emailLinkClass}>
                {CONTACT_EMAIL}
              </a>
            </p>

            <aside className="mt-10 rounded-lg border border-ink/10 bg-white p-5 dark:border-paper/10 dark:bg-paper/5">
              <p className="text-xs font-medium tracking-wider text-ink/60 uppercase dark:text-paper/60">
                Our hosting
              </p>
              <p className="mt-2 font-semibold">DevQuake runs on Hostinger</p>
              <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
                Building something of your own? Start with the same hosting we use.
              </p>
              <a
                href={HOSTINGER_REFERRAL_URL}
                target="_blank"
                rel="sponsored noopener"
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none dark:bg-paper dark:text-ink dark:hover:bg-paper/85"
              >
                Get Hostinger
                <span aria-hidden="true">→</span>
              </a>
              <p className="mt-3 text-xs text-ink/60 dark:text-paper/60">
                Referral link: we may earn a commission at no extra cost to you.
              </p>
            </aside>
          </div>

          <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm dark:border-paper/10 dark:bg-paper/5">
            <ContactForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

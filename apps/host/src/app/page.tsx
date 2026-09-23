import Link from 'next/link';
import { Card } from '@devquake/ui';
import { AuthCard } from '@/components/auth/auth-card';
import { ContactForm } from '@/components/contact-form';
import { HOSTINGER_REFERRAL_URL, SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { ProjectCard } from '@/components/landing/project-card';
import { PublicStatsSection } from '@/components/landing/public-stats';
import { getSessionUser } from '@/lib/auth/session';
import { CONTACT_EMAIL } from '@/lib/legal';
import { listPublicProjects } from '@/lib/public-projects';
import { getPublicStats } from '@/lib/visits';
import { emailLinkClass } from '@/components/form-styles';

export const metadata = {
  // Absolute title: the landing page is the site itself, not "… · DevQuake".
  title: { absolute: 'DevQuake · A developer’s workshop for everyday problems' },
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  // The page still renders (without these sections) if the database is unavailable.
  const [user, projects, stats] = await Promise.all([
    getSessionUser().catch(() => null),
    listPublicProjects().catch(() => null),
    getPublicStats().catch(() => null),
  ]);

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
              <a href="#contact" className="underline decoration-quake underline-offset-2">
                Tell me about it
              </a>
              .
            </p>
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
              <AuthCard />
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
                  <ProjectCard key={p.id} project={p} />
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

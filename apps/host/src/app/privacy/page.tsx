import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { LOCALE_TAGS, rich, type Translate } from '@devquake/ui';
import { CookieSettingsButton } from '@/components/cookie-settings-button';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getLocale, getT } from '@/i18n/server';
import { hostUrl } from '@/lib/domain';
import { languageAlternates } from '@/lib/seo-languages';
import { LOCK_HOURS, CODE_TTL_MINUTES } from '@/lib/auth/flow';
import { SESSION_TTL_HOURS } from '@/lib/auth/session';
import { GA_MEASUREMENT_ID, OPERATOR, PRIVACY_PATH, PRIVACY_POLICY_UPDATED } from '@/lib/legal';
import { RETENTION_DAYS } from '@/lib/retention';
import { emailLinkClass } from '@/components/form-styles';

// Every language version of this policy is equally valid (ADR 0011): the texts live in
// src/i18n/messages/privacy.ts, all four languages side by side.

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('privacy');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: languageAlternates(hostUrl(), PRIVACY_PATH, await getLocale()),
  };
}

const link = 'underline decoration-quake/50 underline-offset-2 hover:decoration-quake';

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mt-12 font-display text-2xl tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-ink/80 dark:text-paper/80">{children}</div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-ink/10 bg-white dark:border-paper/10 dark:bg-paper/5">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-ink/10 text-xs text-ink/60 dark:border-paper/10 dark:text-paper/60">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5 align-top dark:divide-paper/10">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-2.5">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SECTIONS = [
  'who',
  'what',
  'cookies',
  'recipients',
  'retention',
  'rights',
  'security',
  'changes',
] as const;

/** A retention period in words: "2 years", "3 months", "7 days" (in the page language). */
function period(tc: Translate, days: number): string {
  if (days >= 365 && days % 365 === 0) return tc('years', { count: days / 365 });
  if (days >= 60) return tc('months', { count: Math.round(days / 30) });
  return tc('days', { count: days });
}

export default async function PrivacyPage() {
  const [t, tc, locale] = await Promise.all([
    getT('privacy'),
    getT('common.retention'),
    getLocale(),
  ]);
  const r = RETENTION_DAYS;
  const p = (days: number) => period(tc, days);
  const updated = new Date(`${PRIVACY_POLICY_UPDATED}T00:00:00Z`).toLocaleDateString(
    LOCALE_TAGS[locale],
    { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' },
  );
  const mail = (
    <a href={`mailto:${OPERATOR.email}`} className={emailLinkClass}>
      {OPERATOR.email}
    </a>
  );
  const row = (key: string) => [
    t(`what.${key}.data`, { minutes: CODE_TTL_MINUTES }),
    t(`what.${key}.when`),
    t(`what.${key}.why`, { hours: LOCK_HOURS }),
    t(`what.${key}.basis`),
  ];
  const cookie = (name: ReactNode, purpose: string, duration: string, type: string) => [
    <code key="c">{name}</code>,
    purpose,
    duration,
    type,
  ];

  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12 leading-relaxed">
        <h1 className="font-display text-4xl tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">
          {t('updated', { date: updated })}
        </p>
        <p className="mt-6 text-lg text-ink/80 dark:text-paper/80">{t('intro')}</p>
        <p className="mt-3 text-sm text-ink/60 dark:text-paper/60">{t('versions')}</p>

        <nav
          aria-label={t('contents')}
          className="mt-8 rounded-lg border border-ink/10 bg-white p-5 text-sm dark:border-paper/10 dark:bg-paper/5"
        >
          <p className="font-semibold">{t('contents')}</p>
          <ol className="mt-2 grid list-decimal gap-1 pl-5 sm:grid-cols-2">
            {SECTIONS.map((id) => (
              <li key={id}>
                <a href={`#${id}`} className={link}>
                  {t(`toc.${id}`)}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <Section id="who" title={`1. ${t('toc.who')}`}>
          <p>
            {rich(t('who.body'), {
              controller: OPERATOR.name ? <strong>{OPERATOR.name}</strong> : t('who.fallback'),
              address: OPERATOR.address ? `, ${OPERATOR.address}` : '',
              email: mail,
            })}
          </p>
        </Section>

        <Section id="what" title={`2. ${t('toc.what')}`}>
          <Table
            head={[
              t('what.head.data'),
              t('what.head.when'),
              t('what.head.why'),
              t('what.head.basis'),
            ]}
            rows={[
              row('account'),
              row('language'),
              row('roles'),
              row('ideas'),
              row('feedback'),
              row('codes'),
              row('signins'),
              row('contact'),
              row('emails'),
              row('activity'),
              row('profile'),
              row('visits'),
              row('analytics'),
            ]}
          />
          <p>{t('what.note')}</p>
        </Section>

        <Section id="cookies" title={`3. ${t('toc.cookies')}`}>
          <Table
            head={[
              t('cookies.head.cookie'),
              t('cookies.head.purpose'),
              t('cookies.head.duration'),
              t('cookies.head.type'),
            ]}
            rows={[
              cookie(
                'dq_session',
                t('cookies.session'),
                t('cookies.sessionDuration', { hours: SESSION_TTL_HOURS }),
                t('cookies.necessary'),
              ),
              cookie(
                'dq_challenge',
                t('cookies.challenge'),
                t('cookies.minutes', { count: CODE_TTL_MINUTES + 5 }),
                t('cookies.necessary'),
              ),
              cookie('dq_consent', t('cookies.consent'), p(180), t('cookies.necessary')),
              cookie('dq_lang', t('cookies.lang'), p(365), t('cookies.functional')),
              cookie('dq_theme', t('cookies.theme'), p(365), t('cookies.functionalTheme')),
              cookie('dq_tz', t('cookies.timeZone'), p(365), t('cookies.functional')),
              cookie('dq_sidenav', t('cookies.sidenav'), p(365), t('cookies.functional')),
              cookie('_ga', t('cookies.ga'), p(730), t('cookies.analytics')),
              cookie(
                `_ga_${GA_MEASUREMENT_ID.replace(/^G-/, '')}`,
                t('cookies.gaSession'),
                p(730),
                t('cookies.analytics'),
              ),
            ]}
          />
          <p>
            {rich(t('cookies.note'), {
              button: <CookieSettingsButton className={`${link} font-medium`} />,
            })}
          </p>
        </Section>

        <Section id="recipients" title={`4. ${t('toc.recipients')}`}>
          <p>{t('recipients.intro')}</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>{rich(t('recipients.hostinger'), { name: <strong>Hostinger</strong> })}</li>
            <li>{rich(t('recipients.proxycheck'), { name: <strong>proxycheck.io</strong> })}</li>
            <li>{rich(t('recipients.google'), { name: <strong>Google</strong> })}</li>
          </ul>
          <p>{t('recipients.law')}</p>
        </Section>

        <Section id="retention" title={`5. ${t('toc.retention')}`}>
          <p>{t('retention.intro')}</p>
          <Table
            head={[t('retention.head.data'), t('retention.head.kept')]}
            rows={[
              [t('retention.account'), t('retention.accountKept')],
              [t('retention.apps'), t('retention.appsKept')],
              [t('retention.invites'), p(r.unansweredInvites)],
              [t('retention.pending'), p(r.pendingAccounts)],
              [t('retention.signins'), p(r.authSnapshots)],
              [t('retention.activity'), p(r.accountActivity)],
              [t('retention.attempts'), p(r.loginAttempts)],
              [
                t('retention.log'),
                t('retention.logKept', { period: p(r.activityLog), security: p(r.securityLog) }),
              ],
              [t('retention.sessions'), p(r.sessions)],
              [t('retention.emails'), p(r.emailOutbox)],
              [t('retention.contact'), p(r.contactMessages)],
              [t('retention.visitors'), t('retention.visitorsKept')],
              [t('retention.ga'), t('retention.gaKept')],
            ]}
          />
        </Section>

        <Section id="rights" title={`6. ${t('toc.rights')}`}>
          <p>{t('rights.intro')}</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t('rights.access')}</li>
            <li>{t('rights.correct')}</li>
            <li>{t('rights.delete')}</li>
            <li>{t('rights.restrict')}</li>
            <li>{t('rights.withdraw')}</li>
          </ul>
          <p>{rich(t('rights.contact'), { email: mail })}</p>
        </Section>

        <Section id="security" title={`7. ${t('toc.security')}`}>
          <p>{t('security')}</p>
        </Section>

        <Section id="changes" title={`8. ${t('toc.changes')}`}>
          <p>{t('changes')}</p>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}

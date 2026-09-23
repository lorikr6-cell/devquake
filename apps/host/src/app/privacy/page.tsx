import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { CookieSettingsButton } from '@/components/cookie-settings-button';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { LOCK_HOURS, CODE_TTL_MINUTES } from '@/lib/auth/flow';
import { SESSION_TTL_HOURS } from '@/lib/auth/session';
import { GA_MEASUREMENT_ID, OPERATOR, PRIVACY_POLICY_UPDATED } from '@/lib/legal';
import { RETENTION_DAYS } from '@/lib/retention';
import { emailLinkClass } from '@/components/form-styles';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What personal data DevQuake collects, why, for how long, and your rights.',
  alternates: { canonical: '/privacy' },
};

const months = (days: number) =>
  days >= 365 && days % 365 === 0
    ? `${days / 365} ${days === 365 ? 'year' : 'years'}`
    : days >= 60
      ? `${Math.round(days / 30)} months`
      : `${days} days`;

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

const contents = [
  ['who', 'Who is responsible'],
  ['what', 'What we collect and why'],
  ['cookies', 'Cookies'],
  ['recipients', 'Who else processes data'],
  ['retention', 'How long we keep it'],
  ['rights', 'Your rights'],
  ['security', 'Security'],
  ['changes', 'Changes'],
] as const;

export default function PrivacyPage() {
  const r = RETENTION_DAYS;
  const updated = new Date(`${PRIVACY_POLICY_UPDATED}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const mail = (
    <a href={`mailto:${OPERATOR.email}`} className={emailLinkClass}>
      {OPERATOR.email}
    </a>
  );

  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12 leading-relaxed">
        <h1 className="font-display text-4xl tracking-tight">Privacy policy</h1>
        <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">Last updated {updated}</p>
        <p className="mt-6 text-lg text-ink/80 dark:text-paper/80">
          This page explains what personal data devquake.com and its apps on *.devquake.com collect,
          why, how long we keep it, and what you can ask us to do with it. In short: we collect what
          we need to run your account and keep it safe, we never sell data, and analytics only run
          if you say yes.
        </p>

        <nav
          aria-label="Contents"
          className="mt-8 rounded-lg border border-ink/10 bg-white p-5 text-sm dark:border-paper/10 dark:bg-paper/5"
        >
          <p className="font-semibold">Contents</p>
          <ol className="mt-2 grid list-decimal gap-1 pl-5 sm:grid-cols-2">
            {contents.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className={link}>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <Section id="who" title="1. Who is responsible">
          <p>
            The controller of your personal data is{' '}
            {OPERATOR.name ? <strong>{OPERATOR.name}</strong> : 'the operator of devquake.com'}
            {OPERATOR.address ? `, ${OPERATOR.address}` : ''}. For anything related to your data,
            write to {mail}.
          </p>
        </Section>

        <Section id="what" title="2. What we collect and why">
          <Table
            head={['Data', 'When', 'Why', 'Legal basis (GDPR)']}
            rows={[
              [
                'Name, email address, password (stored only as a one-way scrypt hash)',
                'When you create an account',
                'To give you an account and sign you in',
                'Contract (Art. 6(1)(b))',
              ],
              [
                'Roles, assigned projects and apps, and an internal rating set by the site owner',
                'When the owner configures your account',
                'To give you access to the right apps and manage the community',
                'Contract; legitimate interest (Art. 6(1)(f))',
              ],
              [
                `One-time sign-in codes (stored only as a hash, valid ${CODE_TTL_MINUTES} minutes)`,
                'Every sign-in and sign-up',
                'To confirm it is really you',
                'Contract; legitimate interest in security',
              ],
              [
                'Sign-in details: date and time, IP address, approximate location of the IP (country, region, city), internet provider, whether the IP belongs to a VPN or proxy (and its provider), browser, operating system, device type, and your browser’s time zone, language and screen size',
                'Every sign-up, sign-in and code entry, successful or not',
                `To detect and stop account takeovers, lock an account for ${LOCK_HOURS} hours after 3 wrong passwords in a row, show you your recent sign-ins, and produce security statistics`,
                'Legitimate interest in keeping accounts and the site secure',
              ],
              [
                'Name, email address, subject, message, IP address and browser',
                'When you use the contact form',
                'To answer you and to block spam',
                'Legitimate interest in answering enquiries; pre-contract steps where relevant',
              ],
              [
                'Log of emails we sent you (type, time, delivery status; not the content)',
                'When we email you',
                'To troubleshoot delivery and prove security notices were sent',
                'Legitimate interest',
              ],
              [
                'Activity log of actions on the site (for example sign-ins, account changes, errors), with IP address and browser',
                'While you use the site',
                'Security, troubleshooting and abuse prevention',
                'Legitimate interest',
              ],
              [
                'Anonymous visit counts: a daily visitor number derived from your IP address and browser with a random salt that is deleted the next day; only daily totals are kept',
                'Each page view on devquake.com',
                'To show how many people visit (also on the landing page)',
                'Legitimate interest; no cookies, and nobody can be identified from what is stored',
              ],
              [
                'Usage statistics via Google Analytics (pages viewed, approximate location, device, a random identifier in a cookie)',
                'Only if you click “Accept analytics”',
                'To understand which pages are useful and improve the site',
                'Consent (Art. 6(1)(a)), which you can withdraw any time',
              ],
            ]}
          />
          <p>
            We cannot see your device’s MAC address or, if you use a VPN, your real location: we
            only see the VPN server. We do not use your data for advertising, we do not sell it, and
            we make no automated decisions about you other than the temporary security lock
            described above.
          </p>
        </Section>

        <Section id="cookies" title="3. Cookies">
          <Table
            head={['Cookie', 'Purpose', 'Duration', 'Type']}
            rows={[
              [
                <code key="c">dq_session</code>,
                'Keeps you signed in',
                `Up to ${SESSION_TTL_HOURS} hours`,
                'Strictly necessary',
              ],
              [
                <code key="c">dq_challenge</code>,
                'Links a sign-in to the code we emailed',
                `${CODE_TTL_MINUTES + 5} minutes`,
                'Strictly necessary',
              ],
              [
                <code key="c">dq_consent</code>,
                'Remembers your analytics choice on all *.devquake.com sites',
                '6 months',
                'Strictly necessary',
              ],
              [
                <code key="c">_ga</code>,
                'Google Analytics: distinguishes visitors',
                '2 years',
                'Analytics, only with consent',
              ],
              [
                <code key="c">_ga_{GA_MEASUREMENT_ID.replace(/^G-/, '')}</code>,
                'Google Analytics: keeps the session state',
                '2 years',
                'Analytics, only with consent',
              ],
            ]}
          />
          <p>
            Strictly necessary cookies do not need consent. Google Analytics does not load at all
            until you accept, advertising features are switched off, and declining deletes its
            cookies. You can change your choice at any time:{' '}
            <CookieSettingsButton className={`${link} font-medium`} />.
          </p>
        </Section>

        <Section id="recipients" title="4. Who else processes data">
          <p>We only share data with service providers that help us run the site:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Hostinger</strong> hosts the website, the database and our email, so all data
              above is stored on its servers.
            </li>
            <li>
              <strong>proxycheck.io</strong> receives the IP address of each sign-up and sign-in and
              returns its approximate location, provider and whether it is a VPN or proxy.
            </li>
            <li>
              <strong>Google</strong> (Google Analytics) receives usage data only if you accept
              analytics. Google may process it outside the EU, including in the United States under
              the EU–US Data Privacy Framework.
            </li>
          </ul>
          <p>
            We may also disclose data where the law requires it, or to protect the site and its
            users against fraud or abuse.
          </p>
        </Section>

        <Section id="retention" title="5. How long we keep it">
          <p>Old data is deleted automatically once a day after these periods:</p>
          <Table
            head={['Data', 'Kept for']}
            rows={[
              [
                'Your account, roles and project assignments',
                'Until you ask us to delete your account',
              ],
              ['Accounts whose email was never confirmed', months(r.pendingAccounts)],
              ['Sign-in details (snapshots)', months(r.authSnapshots)],
              ['Password attempts used for lockouts', months(r.loginAttempts)],
              [
                'Activity log',
                `${months(r.activityLog)} (security events ${months(r.securityLog)})`,
              ],
              ['Expired sessions and one-time codes', months(r.sessions)],
              ['Record of emails sent', months(r.emailOutbox)],
              ['Contact-form messages', months(r.contactMessages)],
              ['Anonymous visitor hashes and their daily salt', '1 day (only daily totals remain)'],
              [
                'Google Analytics data',
                'Per the retention set in Google Analytics (at most 14 months)',
              ],
            ]}
          />
        </Section>

        <Section id="rights" title="6. Your rights">
          <p>Under the GDPR you can ask us to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>give you a copy of your personal data (access and portability);</li>
            <li>correct it if it is wrong;</li>
            <li>delete it, including your whole account;</li>
            <li>
              restrict or object to how we use it, including processing based on legitimate
              interest;
            </li>
            <li>withdraw your analytics consent at any time (with “Cookie settings”).</li>
          </ul>
          <p>
            Email {mail} from the address on your account. We answer within one month. If you are
            not satisfied, you can complain to the data protection authority of the EU country where
            you live or work.
          </p>
        </Section>

        <Section id="security" title="7. Security">
          <p>
            Passwords are hashed with scrypt, sign-in codes and session tokens are stored only as
            hashes, every sign-in needs a code sent to your email, connections use HTTPS, and
            repeated failed sign-ins lock the account temporarily and notify you. Access to user
            data is limited to the site owner.
          </p>
        </Section>

        <Section id="changes" title="8. Changes">
          <p>
            We update this page when what we collect or why changes, and show the date at the top.
            For significant changes we will also email account holders.
          </p>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}

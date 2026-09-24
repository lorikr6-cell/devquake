import Link from 'next/link';
import { DevQuakeMark } from '@devquake/ui';
import { CONTACT_EMAIL, PRIVACY_PATH } from '@/lib/legal';
import { CookieSettingsButton } from './cookie-settings-button';
import { SectionLink } from './section-link';
import { emailLinkClass } from './form-styles';

/** Hostinger referral link (affiliate: DevQuake may earn a commission). */
export const HOSTINGER_REFERRAL_URL = 'https://www.hostinger.com?REFERRALCODE=BYLLORIKRXAQ';

const link =
  'underline decoration-quake/40 underline-offset-2 hover:decoration-quake focus-visible:outline-2 focus-visible:outline-quake';

/** Public site footer. Never links to /admin-cp. */
export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 dark:border-paper/10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-8 text-sm text-ink/70 dark:text-paper/70">
        <span className="inline-flex items-center gap-2 text-ink dark:text-paper">
          <DevQuakeMark size={20} title="" />© {new Date().getFullYear()} DevQuake
        </span>
        <a href={`mailto:${CONTACT_EMAIL}`} className={emailLinkClass}>
          {CONTACT_EMAIL}
        </a>
        <SectionLink href="/#contact" className={link}>
          Contact
        </SectionLink>
        <a href={HOSTINGER_REFERRAL_URL} target="_blank" rel="sponsored noopener" className={link}>
          Hosted on Hostinger
        </a>
        <Link href={PRIVACY_PATH} className={`${link} sm:ml-auto`}>
          Privacy
        </Link>
        <CookieSettingsButton className={link} />
      </div>
    </footer>
  );
}

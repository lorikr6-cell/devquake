import { LOCALES, type Locale, type Messages } from '@devquake/ui';
import { account } from './messages/account';
import { auth } from './messages/auth';
import { common } from './messages/common';
import { contact } from './messages/contact';
import { email } from './messages/email';
import { ideas } from './messages/ideas';
import { landing } from './messages/landing';
import { privacy } from './messages/privacy';

// Every area of the site (one file per area in ./messages, each with all four languages).
const AREAS = {
  account,
  auth,
  common,
  contact,
  email,
  ideas,
  landing,
  privacy,
} satisfies Record<string, Record<Locale, Messages>>;

/** Areas only the server uses: not sent to browsers with every page. */
const SERVER_ONLY = new Set<string>(['email', 'privacy']);

function build(filter: (area: string) => boolean) {
  return Object.fromEntries(
    LOCALES.map((locale) => [
      locale,
      Object.fromEntries(
        Object.entries(AREAS)
          .filter(([area]) => filter(area))
          .map(([area, texts]) => [area, texts[locale]]),
      ),
    ]),
  ) as Record<Locale, Messages>;
}

const full = build(() => true);
const forClients = build((area) => !SERVER_ONLY.has(area));

/** The whole host catalog in a language: { common: {...}, landing: {...}, ... }. */
export function catalog(locale: Locale): Messages {
  return full[locale];
}

/** The texts client components may need (I18nProvider in the root layout). */
export function clientCatalog(locale: Locale): Messages {
  return forClients[locale];
}

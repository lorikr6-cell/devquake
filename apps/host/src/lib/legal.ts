// Plain constants with no imports: safe (and cheap) in both server and client components.

/** The only public contact address (email signatures, contact section, privacy policy). */
export const CONTACT_EMAIL = 'contact@devquake.com';

/**
 * Who is responsible for personal data on devquake.com (the GDPR "controller").
 * TODO(owner): fill in the legal name (person or company) and postal address; the privacy
 * policy shows them as soon as they are set.
 */
export const OPERATOR = {
  name: 'Kurazs Lorant Alexandru' as string,
  address: 'Telegrafului 34, Timisoara, Timis, Romania 300135' as string,
  email: CONTACT_EMAIL,
};

/** Date the privacy policy text last changed (shown on /privacy). */
export const PRIVACY_POLICY_UPDATED = '2026-09-26';

export const PRIVACY_PATH = '/privacy';

/** Google Analytics 4 property (public identifier, not a secret). */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-44LNW6JYBF';

/** Messages for the referral form's ?error= codes (the control panel is English, ADR 0011). */
export const REFERRAL_ERRORS: Record<string, string> = {
  slug: 'The short link may only contain a-z, 0-9 and dashes (up to 40).',
  name: 'Enter the partner’s name.',
  url: 'The referral link must be a full https:// address.',
  code: 'The referral code may only contain letters, digits, - and _ (up to 40).',
  texts: 'Fill in every text in every language (within the lengths shown).',
  logo: 'The logo must be an SVG (without scripts or outside links), PNG, JPEG or WebP of at most 100 KB.',
  duplicate: 'Another referral already uses this short link.',
};

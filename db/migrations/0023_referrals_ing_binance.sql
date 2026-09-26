-- =============================================================================
-- 0023 — ING and Binance referrals (ADR 0021)
--
-- Seeds two partner referrals for the landing page's "Partner offers" section:
--   ing      ING Bank Romania "recommend a friend" link (code lorantk22616y). No logo: Simple
--            Icons has none for ING; upload the official one in /admin-cp/referrals.
--   binance  Binance registration link (referral id 227244463), with the Simple Icons logo.
-- Links must be https (ADR 0021): the ING link is stored as https://ing.ro/...
-- Texts in English, German, Romanian and Hungarian (ADR 0011).
--
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

INSERT IGNORE INTO external_referrals (slug, name, url, referral_code, texts, sort_order) VALUES (
  'ing',
  'ING',
  'https://ing.ro/lp/mgm-recomandare?code=lorantk22616y',
  'lorantk22616y',
  '{"en":{"label":"Bank account","title":"Open an ING account","body":"Become an ING Bank Romania customer through our recommendation link, or enter our code when you sign up. Check the current offer and conditions on ing.ro.","button":"Join ING"},"de":{"label":"Bankkonto","title":"Eröffne ein ING-Konto","body":"Werde über unseren Empfehlungslink Kunde bei der ING Bank Rumänien, oder gib bei der Anmeldung unseren Code ein. Das aktuelle Angebot und die Bedingungen findest du auf ing.ro.","button":"Zu ING"},"ro":{"label":"Cont bancar","title":"Deschide un cont ING","body":"Devino client ING Bank România prin linkul nostru de recomandare sau introdu codul nostru la înscriere. Verifică oferta curentă și condițiile pe ing.ro.","button":"Intră pe ING"},"hu":{"label":"Bankszámla","title":"Nyiss ING-számlát","body":"Legyél az ING Bank Románia ügyfele az ajánló linkünkkel, vagy add meg a kódunkat a regisztrációnál. Az aktuális ajánlatot és a feltételeket az ing.ro oldalon találod.","button":"Irány az ING"}}',
  40
);

INSERT IGNORE INTO external_referrals (slug, name, url, referral_code, logo, logo_type, texts, sort_order) VALUES (
  'binance',
  'Binance',
  'https://account.binance.com/register?registerChannel=user_center&ref=227244463',
  '227244463',
  '<svg viewBox="-2 -2 28 28" xmlns="http://www.w3.org/2000/svg"><title>Binance</title><path fill="#F0B90B" d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm4.6366-4.6366L24 12l-2.7154 2.7164L18.5682 12l2.6924-2.7164zm-9.272.001l2.7163 2.6914-2.7164 2.7174v-.001L9.2721 12l2.7164-2.7154zm-9.2722-.001L5.4088 12l-2.6914 2.6924L0 12l2.7164-2.7164zM11.9885.0115l7.353 7.329-2.7174 2.7154-4.6356-4.6356-4.6355 4.6595-2.7174-2.7154 7.353-7.353z"/></svg>',
  'image/svg+xml',
  '{"en":{"label":"Crypto exchange","title":"Trade crypto on Binance","body":"Open a Binance account through our invitation link, or enter our referral ID when you register. Crypto is volatile: only invest what you can afford to lose.","button":"Join Binance"},"de":{"label":"Krypto-Börse","title":"Krypto handeln bei Binance","body":"Eröffne ein Binance-Konto über unseren Einladungslink oder gib bei der Registrierung unsere Empfehlungs-ID ein. Kryptowährungen schwanken stark: Investiere nur, was du verlieren kannst.","button":"Zu Binance"},"ro":{"label":"Bursă de criptomonede","title":"Tranzacționează cripto pe Binance","body":"Deschide un cont Binance prin linkul nostru de invitație sau introdu ID-ul nostru de recomandare la înregistrare. Criptomonedele sunt volatile: investește doar cât îți permiți să pierzi.","button":"Intră pe Binance"},"hu":{"label":"Kriptotőzsde","title":"Kereskedj kriptóval a Binance-en","body":"Nyiss Binance-fiókot a meghívó linkünkkel, vagy add meg az ajánlói azonosítónkat a regisztrációnál. A kriptovaluták árfolyama erősen ingadozik: csak annyit fektess be, amennyit megengedhetsz magadnak, hogy elveszíts.","button":"Irány a Binance"}}',
  50
);

INSERT IGNORE INTO schema_migrations (version) VALUES ('0023_referrals_ing_binance');

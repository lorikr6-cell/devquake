-- =============================================================================
-- 0020 — External referrals (ADR 0021)
--
-- external_referrals  partner referral links shown on the landing page like the Hostinger box,
--                     each with a QR code. Managed in /admin-cp/referrals. Visitors go through
--                     /go/<slug> (counted in `clicks`, no personal data), so a printed QR code
--                     keeps working when the partner link changes.
--   texts             JSON per language: {"en":{"label","title","body","button"},"de":…,"ro":…,"hu":…}
--
-- Seeds the Bitget referral. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS external_referrals (
  id          INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(40)       NOT NULL,
  name        VARCHAR(80)       NOT NULL,
  url         VARCHAR(1000)     NOT NULL,
  texts       TEXT              NOT NULL,
  is_active   TINYINT(1)        NOT NULL DEFAULT 1,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  clicks      INT UNSIGNED      NOT NULL DEFAULT 0,
  created_at  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_external_referrals_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO external_referrals (slug, name, url, texts, sort_order) VALUES (
  'bitget',
  'Bitget',
  'https://www.bitgetapps.com/referral/register?clacCode=QAKXLDX4&from=%2Fevents%2Freferral-all-program&source=events&utmSource=PremierInviter',
  '{"en":{"label":"Crypto exchange","title":"Trade crypto on Bitget","body":"Open a Bitget account through our invitation link. Crypto is volatile: only invest what you can afford to lose.","button":"Join Bitget"},"de":{"label":"Krypto-Börse","title":"Krypto handeln bei Bitget","body":"Eröffne ein Bitget-Konto über unseren Einladungslink. Kryptowährungen schwanken stark: Investiere nur, was du verlieren kannst.","button":"Zu Bitget"},"ro":{"label":"Bursă de criptomonede","title":"Tranzacționează cripto pe Bitget","body":"Deschide un cont Bitget prin linkul nostru de invitație. Criptomonedele sunt volatile: investește doar cât îți permiți să pierzi.","button":"Intră pe Bitget"},"hu":{"label":"Kriptotőzsde","title":"Kereskedj kriptóval a Bitgeten","body":"Nyiss Bitget-fiókot a meghívó linkünkkel. A kriptovaluták árfolyama erősen ingadozik: csak annyit fektess be, amennyit megengedhetsz magadnak, hogy elveszíts.","button":"Irány a Bitget"}}',
  10
);

INSERT IGNORE INTO schema_migrations (version) VALUES ('0020_external_referrals');

-- =============================================================================
-- 0021 — Referral codes and the Crypto.com referral (ADR 0021)
--
-- external_referrals.referral_code  optional code people type when the partner's app asks for
--                                   it (shown in the box with a copy button).
-- Sets Bitget's code and seeds Crypto.com.
--
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'external_referrals' AND COLUMN_NAME = 'referral_code') = 0,
  'ALTER TABLE external_referrals ADD COLUMN referral_code VARCHAR(40) NULL AFTER url',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

UPDATE external_referrals SET referral_code = 'QAKXLDX4'
 WHERE slug = 'bitget' AND referral_code IS NULL;

INSERT IGNORE INTO external_referrals (slug, name, url, referral_code, texts, sort_order) VALUES (
  'crypto-com',
  'Crypto.com',
  'https://crypto.com/app/6h28v4e788',
  '6h28v4e788',
  '{"en":{"label":"Crypto app","title":"Get the Crypto.com app","body":"Join Crypto.com through our link, or enter our referral code when the app asks for one. Crypto is volatile: only invest what you can afford to lose.","button":"Join Crypto.com"},"de":{"label":"Krypto-App","title":"Hol dir die Crypto.com-App","body":"Melde dich über unseren Link bei Crypto.com an oder gib unseren Empfehlungscode ein, wenn die App danach fragt. Kryptowährungen schwanken stark: Investiere nur, was du verlieren kannst.","button":"Zu Crypto.com"},"ro":{"label":"Aplicație cripto","title":"Descarcă aplicația Crypto.com","body":"Înscrie-te pe Crypto.com prin linkul nostru sau introdu codul nostru de recomandare când aplicația îl cere. Criptomonedele sunt volatile: investește doar cât îți permiți să pierzi.","button":"Intră pe Crypto.com"},"hu":{"label":"Kriptoalkalmazás","title":"Töltsd le a Crypto.com alkalmazást","body":"Regisztrálj a Crypto.comra a linkünkkel, vagy add meg az ajánlói kódunkat, amikor az alkalmazás kéri. A kriptovaluták árfolyama erősen ingadozik: csak annyit fektess be, amennyit megengedhetsz magadnak, hogy elveszíts.","button":"Irány a Crypto.com"}}',
  20
);

INSERT IGNORE INTO schema_migrations (version) VALUES ('0021_referral_codes');

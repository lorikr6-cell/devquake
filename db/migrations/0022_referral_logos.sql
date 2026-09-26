-- =============================================================================
-- 0022 — Referral logos and the Revolut referral (ADR 0021)
--
-- external_referrals.logo       optional partner logo (SVG, PNG, JPEG or WebP, at most 100 KB),
--                               shown in the top right corner of the referral box; uploaded in
--                               /admin-cp/referrals and served by /go/<slug>/logo.
-- external_referrals.logo_type  its media type.
-- Sets the Bitget and Crypto.com logos and seeds Revolut with its logo.
--
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'external_referrals' AND COLUMN_NAME = 'logo') = 0,
  'ALTER TABLE external_referrals ADD COLUMN logo MEDIUMBLOB NULL AFTER referral_code, ADD COLUMN logo_type VARCHAR(40) NULL AFTER logo',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

UPDATE external_referrals SET logo = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#00F0FF"/><path fill="#000" d="M11.121 9.46h4.283l4.381 4.555a.785.785 0 0 1 .003 1.076L14.17 21H9.757l1.334-1.357 4.898-5.092-4.836-5.092"/><path fill="#000" d="M12.879 14.54H8.596L4.215 9.986a.785.785 0 0 1-.003-1.076L9.83 3h4.412l-1.334 1.357L8.01 9.449l4.836 5.092"/></svg>', logo_type = 'image/svg+xml'
 WHERE slug = 'bitget' AND logo IS NULL;

UPDATE external_referrals SET logo = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M12 3.001 4.2 7.505v8.999L12 21l7.8-4.496v-9zm0 0L4.2 7.505v8.999L12 21l7.8-4.496v-9z"/><path fill="#03316C" d="M15.078 17.487h-1.113l-1.321-1.221v-.625l1.371-1.307V12.25l1.796-1.171 2.047 1.544zm-4.596-3.283.208-1.953-.675-1.753h3.972l-.661 1.753.187 1.953zm.905 2.061-1.322 1.236H8.938l-2.794-4.877 2.061-1.53 1.81 1.157v2.083l1.372 1.307zM8.923 6.893h6.141l.733 3.124H8.205zM11.997 3 4.205 7.503v9l7.792 4.496 7.8-4.496v-9z"/></svg>', logo_type = 'image/svg+xml'
 WHERE slug = 'crypto-com' AND logo IS NULL;

INSERT IGNORE INTO external_referrals (slug, name, url, logo, logo_type, texts, sort_order) VALUES (
  'revolut',
  'Revolut',
  'https://revolut.com/referral/?referral-code=lorantt6v!SEP2-26-VR-RO&geo-redirect',
  '<svg viewBox="-2 -2 28 28" xmlns="http://www.w3.org/2000/svg"><title>Revolut</title><path fill="#191C1F" d="M20.9133 6.9566C20.9133 3.1208 17.7898 0 13.9503 0H2.424v3.8605h10.9782c1.7376 0 3.177 1.3651 3.2087 3.043.016.84-.2994 1.633-.8878 2.2324-.5886.5998-1.375.9303-2.2144.9303H9.2322a.2756.2756 0 0 0-.2755.2752v3.431c0 .0585.018.1142.052.1612L16.2646 24h5.3114l-7.2727-10.094c3.6625-.1838 6.61-3.2612 6.61-6.9494zM6.8943 5.9229H2.424V24h4.4704z"/></svg>',
  'image/svg+xml',
  '{"en":{"label":"Money app","title":"Open a Revolut account","body":"Join Revolut through our link: one app for your card, payments, transfers and savings. Check the conditions and any rewards in the app.","button":"Join Revolut"},"de":{"label":"Finanz-App","title":"Eröffne ein Revolut-Konto","body":"Melde dich über unseren Link bei Revolut an: eine App für Karte, Zahlungen, Überweisungen und Sparen. Bedingungen und mögliche Prämien findest du in der App.","button":"Zu Revolut"},"ro":{"label":"Aplicație financiară","title":"Deschide un cont Revolut","body":"Înscrie-te pe Revolut prin linkul nostru: o singură aplicație pentru card, plăți, transferuri și economii. Verifică în aplicație condițiile și eventualele recompense.","button":"Intră pe Revolut"},"hu":{"label":"Pénzügyi alkalmazás","title":"Nyiss Revolut-fiókot","body":"Regisztrálj a Revolutra a linkünkkel: egy alkalmazás a kártyádhoz, fizetésekhez, utalásokhoz és megtakarításokhoz. A feltételeket és az esetleges jutalmakat az alkalmazásban találod.","button":"Irány a Revolut"}}',
  30
);

INSERT IGNORE INTO schema_migrations (version) VALUES ('0022_referral_logos');

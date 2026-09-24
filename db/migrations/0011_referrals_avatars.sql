-- =============================================================================
-- 0011 — Referrals (invite link / QR / email, NPS score) and profile avatars
--
-- users.referral_code  personal code in the invite link devquake.com/r/<code>
-- users.nps            successful referrals: +1 when an invited person ACTIVATES an account
-- users.referred_by    who invited this user (kept NULL when that user is deleted)
-- referral_invites     invites a user sent by email, and sign-ups that came through their link
--                      status: sent → signed_up (account created) → joined (activated, +1 NPS)
-- user_avatars         one small image per user (resized to 256x256 in the browser)
--
-- SAFE TO RE-RUN: columns/constraints are only added when missing.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'referral_code') = 0,
  'ALTER TABLE users ADD COLUMN referral_code VARCHAR(12) CHARACTER SET ascii COLLATE ascii_bin NULL AFTER rating, ADD UNIQUE KEY uq_users_referral_code (referral_code)',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'nps') = 0,
  'ALTER TABLE users ADD COLUMN nps INT UNSIGNED NOT NULL DEFAULT 0 AFTER referral_code',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'referred_by') = 0,
  'ALTER TABLE users ADD COLUMN referred_by INT UNSIGNED NULL AFTER nps',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      AND CONSTRAINT_NAME = 'fk_users_referred_by') = 0,
  'ALTER TABLE users ADD CONSTRAINT fk_users_referred_by FOREIGN KEY (referred_by) REFERENCES users (id) ON DELETE SET NULL',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

CREATE TABLE IF NOT EXISTS referral_invites (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inviter_id       INT UNSIGNED    NOT NULL,
  -- Address the inviter entered; NULL for sign-ups through the shared link (their address is
  -- not shown to the inviter) and after the invited person deleted their account.
  email            VARCHAR(254)    NULL,
  via_link         TINYINT(1)      NOT NULL DEFAULT 0,
  status           ENUM('sent','signed_up','joined') NOT NULL DEFAULT 'sent',
  invitee_user_id  INT UNSIGNED    NULL,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  signed_up_at     DATETIME        NULL,
  joined_at        DATETIME        NULL,
  PRIMARY KEY (id),
  KEY ix_referral_invites_inviter (inviter_id, created_at),
  KEY ix_referral_invites_email (email, status),
  KEY ix_referral_invites_invitee (invitee_user_id),
  CONSTRAINT fk_referral_invites_inviter FOREIGN KEY (inviter_id)      REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_referral_invites_invitee FOREIGN KEY (invitee_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_avatars (
  user_id     INT UNSIGNED NOT NULL,
  mime        VARCHAR(20)  NOT NULL,
  data        MEDIUMBLOB   NOT NULL,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_avatars_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0011_referrals_avatars');

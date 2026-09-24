-- =============================================================================
-- 0009 — Account activation by email link
--
-- Sign-up now sends a welcome email with an activation link instead of a code. The account
-- stays 'pending' until the link is opened; only then can the user sign in (sign-in itself
-- still ends with an emailed one-time code).
--
-- account_activations  one row per activation link. Only SHA-256 of the link token is stored,
--                      so a database leak cannot be used to activate accounts. Links expire
--                      after 48 hours and work once.
--
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS account_activations (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED    NOT NULL,
  token_hash  CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME        NOT NULL,
  used_at     DATETIME        NULL,
  ip          VARCHAR(45)     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_account_activations_token (token_hash),
  KEY ix_account_activations_user (user_id, created_at),
  CONSTRAINT fk_account_activations_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- New snapshot step "activate" (MODIFY is idempotent: re-running it changes nothing).
ALTER TABLE auth_snapshots
  MODIFY COLUMN event ENUM('signup','signin','verify','resend','activate') NOT NULL;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0009_account_activation');

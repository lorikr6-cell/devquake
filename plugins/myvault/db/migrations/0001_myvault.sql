-- =============================================================================
-- myvault 0001 — My vault (the plugin's OWN database, ADR 0007 and ADR 0022)
--
-- Apply to the vault database (e.g. u962314563_myvault), NOT the platform database:
--   pnpm db:migrate --plugin myvault     (uses MYVAULT_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- Nothing readable is stored here. An entry's content is encrypted in the owner's browser
-- (AES-256-GCM) with a key derived from the vault key AND the answers to its three questions;
-- the database keeps only the ciphertext, a check value of the vault key (SHA-256), a slow hash
-- of the answers (scrypt) and, only when the entry has recipients, the vault key sealed with the
-- server's master key (MYVAULT_MASTER_KEY) so it can be sent to them later.
-- user ids are the platform's user ids (no cross-database foreign keys).
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(100) NOT NULL,
  applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One vault entry. title and category are NOT encrypted (they appear in lists and in the
-- release email); everything else the owner wrote is in ciphertext.
CREATE TABLE IF NOT EXISTS entries (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  owner_user_id    INT UNSIGNED  NOT NULL,
  owner_name       VARCHAR(100)  NOT NULL,
  title            VARCHAR(120)  NOT NULL,
  category         VARCHAR(20)   NOT NULL DEFAULT 'note',
  -- Encryption (browser): HKDF salt, AES-GCM nonce, ciphertext.
  kdf_salt         VARBINARY(32) NOT NULL,
  iv               VARBINARY(16) NOT NULL,
  ciphertext       MEDIUMBLOB    NOT NULL,
  content_bytes    INT UNSIGNED  NOT NULL,
  -- Checks (server): SHA-256 of the vault key, scrypt of the normalised answers.
  key_check        CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  answers_salt     VARBINARY(32) NOT NULL,
  answers_hash     VARBINARY(64) NOT NULL,
  -- Release to recipients: the sealed vault key (only with recipients), inactivity and date.
  sealed_key       VARBINARY(128) NULL,
  inactive_days    SMALLINT UNSIGNED NULL,
  not_before       DATE          NULL,
  rule_set_at      DATETIME      NULL,
  warned_for       DATETIME      NULL,
  released_at      DATETIME      NULL,
  -- Attempts: consecutive failures and the lock.
  failed_attempts  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  locked_until     DATETIME      NULL,
  -- Set when an entry gets locked; the scheduled job emails the owner and clears it.
  lock_notify      TINYINT(1)    NOT NULL DEFAULT 0,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_entries_owner (owner_user_id),
  KEY ix_entries_release (released_at, inactive_days)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The three questions (shown to whoever opens the entry; the answers are never stored).
CREATE TABLE IF NOT EXISTS entry_questions (
  entry_id  INT UNSIGNED     NOT NULL,
  position  TINYINT UNSIGNED NOT NULL,
  prompt    VARCHAR(200)     NOT NULL,
  type      VARCHAR(10)      NOT NULL,
  options   TEXT             NULL,
  PRIMARY KEY (entry_id, position),
  CONSTRAINT fk_entry_questions_entry FOREIGN KEY (entry_id) REFERENCES entries (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Who receives the vault key when the release rule triggers (DevQuake accounts).
CREATE TABLE IF NOT EXISTS entry_recipients (
  entry_id      INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  display_name  VARCHAR(100) NOT NULL,
  notified_at   DATETIME     NULL,
  PRIMARY KEY (entry_id, user_id),
  KEY ix_entry_recipients_user (user_id),
  CONSTRAINT fk_entry_recipients_entry FOREIGN KEY (entry_id) REFERENCES entries (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Every try to open an entry: who, when, whether the key and the answers were right, and (for
-- failed tries, so the owner can review them) the answers given, sealed with the master key.
CREATE TABLE IF NOT EXISTS attempts (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entry_id        INT UNSIGNED    NOT NULL,
  user_id         INT UNSIGNED    NULL,
  user_name       VARCHAR(100)    NULL,
  key_ok          TINYINT(1)      NOT NULL,
  ok              TINYINT(1)      NOT NULL,
  answers_sealed  VARBINARY(2048) NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_attempts_entry (entry_id, id),
  KEY ix_attempts_user (user_id),
  CONSTRAINT fk_attempts_entry FOREIGN KEY (entry_id) REFERENCES entries (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- When each owner last used the vault app (a fallback for the inactivity rule on hosts that do
-- not report DevQuake-wide activity).
CREATE TABLE IF NOT EXISTS activity (
  user_id       INT UNSIGNED NOT NULL,
  last_seen_at  DATETIME     NOT NULL,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0001_myvault');

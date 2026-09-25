-- =============================================================================
-- 0018 — Password reset, 24-hour app trials, custom themes and a preferred language
--
-- password_resets     one row per "forgot password" email. Only SHA-256 of the link token is
--                     stored; a link works once and expires after 60 minutes (ADR 0017).
-- project_trials      a member's one-time 24-hour trial of a project's app (ADR 0016). If they
--                     do not subscribe, the app deletes what they created 30 days after the
--                     trial ended (data_deleted_at records when).
-- user_themes         colour themes members made: name plus colours and fonts as JSON
--                     (ADR 0017). Only the creator and the people it is shared with see it.
-- user_theme_shares   who a theme is shared with (by email address, existing members only).
-- users.preferred_locale  the language the member chose in their profile; NULL = automatic
--                     (the language they browse in, users.locale).
--
-- Every table references users with ON DELETE CASCADE, so deleting an account removes it all.
--
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS password_resets (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED    NOT NULL,
  token_hash  CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME        NOT NULL,
  used_at     DATETIME        NULL,
  ip          VARCHAR(45)     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_password_resets_token (token_hash),
  KEY ix_password_resets_user (user_id, created_at),
  KEY ix_password_resets_ip (ip, created_at),
  CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_trials (
  user_id          INT UNSIGNED NOT NULL,
  project_id       INT UNSIGNED NOT NULL,
  started_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at       DATETIME     NOT NULL,
  data_deleted_at  DATETIME     NULL,
  PRIMARY KEY (user_id, project_id),
  KEY ix_project_trials_project (project_id),
  KEY ix_project_trials_expires (expires_at, data_deleted_at),
  CONSTRAINT fk_project_trials_user    FOREIGN KEY (user_id)    REFERENCES users (id)    ON DELETE CASCADE,
  CONSTRAINT fk_project_trials_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_themes (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  name        VARCHAR(60)  NOT NULL,
  -- {"colors":{"background":"#rrggbb","text":"#rrggbb","accent":"#rrggbb"},"fonts":{"h1":"lora",...}}
  settings    TEXT         NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_user_themes_user (user_id),
  CONSTRAINT fk_user_themes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_theme_shares (
  theme_id   INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  shared_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (theme_id, user_id),
  KEY ix_user_theme_shares_user (user_id),
  CONSTRAINT fk_user_theme_shares_theme FOREIGN KEY (theme_id) REFERENCES user_themes (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_theme_shares_user  FOREIGN KEY (user_id)  REFERENCES users (id)       ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'preferred_locale') = 0,
  'ALTER TABLE users ADD COLUMN preferred_locale CHAR(2) NULL AFTER locale',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0018_trials_themes_password_reset');

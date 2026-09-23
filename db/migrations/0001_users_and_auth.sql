-- =============================================================================
-- 0001 — Users, roles, sessions and login attempts
--
-- Target: MySQL 8.0+ or MariaDB 10.6+ (Hostinger). Import into the existing
-- database (u962314563_devquake) with phpMyAdmin or `pnpm db:migrate`.
-- All DATETIME columns hold UTC: the app sets `time_zone = '+00:00'` per connection.
-- =============================================================================

SET NAMES utf8mb4;

-- Tracks which migration files have been applied (used by scripts/db-migrate.mjs).
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(100) NOT NULL,
  applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- users — one account across the host and every plugin.
-- email is stored lowercased by the app. password_hash uses the format
-- "scrypt$N$r$p$<salt b64>$<hash b64>" (see apps/host/src/lib/auth/password.ts).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                   INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  email                VARCHAR(254)      NOT NULL,
  display_name         VARCHAR(100)      NOT NULL,
  password_hash        VARCHAR(255)      NOT NULL,
  status               ENUM('active','disabled','pending') NOT NULL DEFAULT 'active',
  -- Reserved for TOTP two-factor authentication (base32 secret, set when enrolled).
  totp_secret          VARCHAR(64)       NULL,
  totp_enabled_at      DATETIME          NULL,
  failed_login_count   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  locked_until         DATETIME          NULL,
  last_login_at        DATETIME          NULL,
  last_login_ip        VARCHAR(45)       NULL,
  password_changed_at  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at           DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY ix_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- roles — platform roles (scope = 'platform') and per-plugin roles
-- (scope = plugin id, e.g. code 'bills.admin', scope 'bills').
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id           SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code         VARCHAR(64)       NOT NULL,
  scope        VARCHAR(64)       NOT NULL DEFAULT 'platform',
  name         VARCHAR(100)      NOT NULL,
  description  VARCHAR(255)      NULL,
  created_at   DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_code (code),
  KEY ix_roles_scope (scope)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id     INT UNSIGNED      NOT NULL,
  role_id     SMALLINT UNSIGNED NOT NULL,
  granted_by  INT UNSIGNED      NULL,
  granted_at  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  KEY ix_user_roles_role (role_id),
  CONSTRAINT fk_user_roles_user    FOREIGN KEY (user_id)    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role    FOREIGN KEY (role_id)    REFERENCES roles (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_granter FOREIGN KEY (granted_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- sessions — server-side sessions. The browser cookie holds a random token;
-- only its SHA-256 hash is stored, so a leaked table cannot be replayed.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED    NOT NULL,
  token_hash    CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  ip            VARCHAR(45)     NULL,
  user_agent    VARCHAR(512)    NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME        NOT NULL,
  revoked_at    DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token_hash (token_hash),
  KEY ix_sessions_user (user_id),
  KEY ix_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- login_attempts — every login attempt, used for brute-force throttling
-- (per email and per IP) and for the security view of the activity log.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_attempts (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email       VARCHAR(254)    NOT NULL,
  ip          VARCHAR(45)     NULL,
  user_agent  VARCHAR(512)    NULL,
  succeeded   TINYINT(1)      NOT NULL DEFAULT 0,
  reason      VARCHAR(40)     NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_login_attempts_email_time (email, created_at),
  KEY ix_login_attempts_ip_time (ip, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0001_users_and_auth');

-- =============================================================================
-- 0005 — Public user accounts: sign-up, emailed sign-in codes, sign-in snapshots,
--        owner role, project assignments, user rating and an email outbox.
--
-- SAFE TO RE-RUN: columns and the rating check are only added when missing (MySQL has no
-- ADD COLUMN IF NOT EXISTS, so each ALTER is guarded via information_schema); every other
-- statement is idempotent.
-- =============================================================================

SET NAMES utf8mb4;

-- One-time steps below only run until this migration is recorded as done.
SET @dq_0005_done := (SELECT COUNT(*) FROM schema_migrations WHERE version = '0005_user_accounts');

-- users.email_verified_at, users.rating and the rating check (each only if missing)
SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verified_at') = 0,
  'ALTER TABLE users ADD COLUMN email_verified_at DATETIME NULL AFTER status',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'rating') = 0,
  'ALTER TABLE users ADD COLUMN rating TINYINT UNSIGNED NULL AFTER display_name',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      AND CONSTRAINT_NAME = 'ck_users_rating') = 0,
  'ALTER TABLE users ADD CONSTRAINT ck_users_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

-- Existing accounts were created by the owner with pnpm admin:create: treat them as verified.
UPDATE users SET email_verified_at = created_at
 WHERE email_verified_at IS NULL AND status = 'active' AND @dq_0005_done = 0;

-- -----------------------------------------------------------------------------
-- Roles: the owner sees everything (users, statistics, activity log); an admin
-- (granted by the owner) may use /admin-cp without the user management pages.
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO roles (code, scope, name, description) VALUES
  ('platform.owner', 'platform', 'Owner', 'Site owner: user management, statistics and activity log');

UPDATE roles SET name = 'Administrator',
                 description = 'May sign in to /admin-cp (dashboard, ideas, projects); no user management'
 WHERE code = 'platform.admin';

-- Every admin that exists before this migration is the owner. One-time only: on a re-run this
-- must not promote admins that the owner granted later.
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT ur.user_id, (SELECT id FROM roles WHERE code = 'platform.owner')
  FROM user_roles ur JOIN roles r ON r.id = ur.role_id
 WHERE r.code = 'platform.admin' AND @dq_0005_done = 0;

-- -----------------------------------------------------------------------------
-- user_projects — which projects / plugins a user is assigned to, and as what.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_projects (
  user_id       INT UNSIGNED NOT NULL,
  project_id    INT UNSIGNED NOT NULL,
  project_role  ENUM('viewer','member','manager') NOT NULL DEFAULT 'member',
  assigned_by   INT UNSIGNED NULL,
  assigned_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, project_id),
  KEY ix_user_projects_project (project_id),
  CONSTRAINT fk_user_projects_user     FOREIGN KEY (user_id)     REFERENCES users (id)    ON DELETE CASCADE,
  CONSTRAINT fk_user_projects_project  FOREIGN KEY (project_id)  REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_projects_assigner FOREIGN KEY (assigned_by) REFERENCES users (id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- auth_snapshots — one row per sign-up / sign-in step: when, where from, which
-- browser, and whether the IP belongs to a VPN / proxy (and where that exit is).
-- MAC addresses are not collectable over the internet and are not stored.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_snapshots (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  occurred_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  event            ENUM('signup','signin','verify','resend') NOT NULL,
  outcome          VARCHAR(30)     NOT NULL,
  user_id          INT UNSIGNED    NULL,
  email            VARCHAR(254)    NULL,
  context          ENUM('site','admin-cp') NOT NULL DEFAULT 'site',
  ip               VARCHAR(45)     NULL,
  -- Location of the IP (for a VPN: the VPN exit, not the person).
  country_code     CHAR(2)         NULL,
  country          VARCHAR(80)     NULL,
  region           VARCHAR(80)     NULL,
  city             VARCHAR(80)     NULL,
  latitude         DECIMAL(8,4)    NULL,
  longitude        DECIMAL(8,4)    NULL,
  ip_timezone      VARCHAR(64)     NULL,
  asn              VARCHAR(20)     NULL,
  isp              VARCHAR(120)    NULL,
  is_proxy         TINYINT(1)      NULL,
  proxy_type       VARCHAR(30)     NULL,
  vpn_operator     VARCHAR(80)     NULL,
  -- Browser / device.
  user_agent       VARCHAR(512)    NULL,
  browser          VARCHAR(40)     NULL,
  browser_version  VARCHAR(20)     NULL,
  os               VARCHAR(40)     NULL,
  device_type      VARCHAR(12)     NULL,
  accept_language  VARCHAR(100)    NULL,
  client_timezone  VARCHAR(64)     NULL,
  client_language  VARCHAR(35)     NULL,
  screen           VARCHAR(20)     NULL,
  -- Browser time zone differs from the IP's time zone: a common VPN / proxy hint.
  timezone_mismatch TINYINT(1)     NULL,
  PRIMARY KEY (id),
  KEY ix_auth_snapshots_time (occurred_at),
  KEY ix_auth_snapshots_user (user_id, occurred_at),
  KEY ix_auth_snapshots_email (email, occurred_at),
  KEY ix_auth_snapshots_event (event, outcome, occurred_at),
  KEY ix_auth_snapshots_country (country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- login_challenges — the emailed one-time code for each sign-in / sign-up.
-- The code itself is never stored: code_hash = SHA-256(browser token + ":" + code),
-- and the browser token lives only in an HttpOnly cookie.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_challenges (
  id            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED     NOT NULL,
  purpose       ENUM('signin','signup','admin') NOT NULL,
  token_hash    CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  code_hash     CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  attempts      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  resends       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  ip            VARCHAR(45)      NULL,
  snapshot_id   BIGINT UNSIGNED  NULL,
  created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  code_sent_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME         NOT NULL,
  consumed_at   DATETIME         NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_login_challenges_token (token_hash),
  KEY ix_login_challenges_user (user_id, created_at),
  CONSTRAINT fk_login_challenges_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- email_outbox — every email the site sends (codes, account changes, lock notices).
-- Bodies are not stored: sign-in codes must not sit in the database in clear text.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_outbox (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_at  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  user_id     INT UNSIGNED    NULL,
  to_email    VARCHAR(254)    NOT NULL,
  template    VARCHAR(40)     NOT NULL,
  subject     VARCHAR(200)    NOT NULL,
  status      ENUM('sent','failed','logged') NOT NULL,
  error       VARCHAR(500)    NULL,
  PRIMARY KEY (id),
  KEY ix_email_outbox_user (user_id, created_at),
  KEY ix_email_outbox_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0005_user_accounts');

-- Retention (manual, like 0003):
--   DELETE FROM login_challenges WHERE expires_at < UTC_TIMESTAMP() - INTERVAL 7 DAY;
--   DELETE FROM auth_snapshots   WHERE occurred_at < UTC_TIMESTAMP() - INTERVAL 365 DAY;

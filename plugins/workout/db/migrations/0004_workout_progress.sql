-- =============================================================================
-- workout 0004 — Progress photos, monthly summary emails (the plugin's OWN database, ADR 0015)
--
-- progress_photos: photos people take of themselves to see their transformation. One starting
--   photo ('start'), at most one per month ('month', period = first day of the month) and per
--   year ('year', period = 1 January). Only the person can see them; deleteUserData removes
--   them, and so does the delete button.
-- profiles.monthly_email: the monthly summary email (on by default; turned off in the profile).
-- monthly_reports: which month's email a person got, so it is sent once only (the row is
--   written before sending; sent = 1 or 0 afterwards).
--
-- Apply to the workout database: pnpm db:migrate --plugin workout, or phpMyAdmin → Import.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles' AND COLUMN_NAME = 'monthly_email') = 0,
  'ALTER TABLE profiles ADD COLUMN monthly_email TINYINT(1) NOT NULL DEFAULT 1 AFTER low_impact',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

CREATE TABLE IF NOT EXISTS progress_photos (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  NOT NULL,
  kind        ENUM('start','month','year') NOT NULL,
  period      DATE          NOT NULL,
  mime        VARCHAR(20)   NOT NULL,
  data        MEDIUMBLOB    NOT NULL,
  bytes       INT UNSIGNED  NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_progress_photos_period (user_id, kind, period),
  KEY ix_progress_photos_user (user_id, period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS monthly_reports (
  user_id     INT UNSIGNED NOT NULL,
  month       CHAR(7)      NOT NULL,   -- 'YYYY-MM'
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent        TINYINT(1)   NULL,
  PRIMARY KEY (user_id, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0004_workout_progress');

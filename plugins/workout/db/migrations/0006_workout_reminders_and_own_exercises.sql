-- =============================================================================
-- workout 0006 — Plan reminders and own exercises (ADR 0019)
--
-- Apply to the workout database (u962314563_workout), NOT the platform database.
--
-- plan_entries.remind_minutes  NULL = no reminder; 0, 10, 30 or 60 minutes before the start.
-- profiles.time_zone           the person's IANA time zone (e.g. Europe/Bucharest), kept up to
--                              date from their visits, to send reminders at their local time.
-- plan_reminders               one row per slot and day a reminder was sent, so nobody gets
--                              the same reminder twice. Rows older than 30 days are removed.
-- exercises.how_to             own exercises (user_id set, slug 'u<id>'): the person's own
--                              description; built-in exercises are described in translations.
--
-- Deleted by deleteUserData (src/platform.ts) with the rest of the person's data.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'plan_entries' AND COLUMN_NAME = 'remind_minutes') = 0,
  'ALTER TABLE plan_entries ADD COLUMN remind_minutes SMALLINT UNSIGNED NULL AFTER duration_minutes',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles' AND COLUMN_NAME = 'time_zone') = 0,
  'ALTER TABLE profiles ADD COLUMN time_zone VARCHAR(64) NULL',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'exercises' AND COLUMN_NAME = 'how_to') = 0,
  'ALTER TABLE exercises ADD COLUMN how_to VARCHAR(600) NULL AFTER name',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

CREATE TABLE IF NOT EXISTS plan_reminders (
  entry_id  INT UNSIGNED NOT NULL,
  user_id   INT UNSIGNED NOT NULL,
  day       DATE         NOT NULL,
  sent_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (entry_id, day),
  KEY ix_plan_reminders_user (user_id),
  CONSTRAINT fk_plan_reminders_entry FOREIGN KEY (entry_id) REFERENCES plan_entries (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

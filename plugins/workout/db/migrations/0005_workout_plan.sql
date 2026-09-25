-- =============================================================================
-- workout 0005 — The workout plan (ADR 0018)
--
-- Apply to the workout database (u962314563_workout), NOT the platform database.
--
-- plan_entries  a routine placed at a time of day, every day (weekday NULL) or on one weekday
--               (1 = Monday … 7 = Sunday). start_minute is wall-clock time in the person's own
--               time zone (07:30 = 450), not a timestamp; the slot lasts duration_minutes and
--               ends by midnight. The app refuses slots that overlap on the same day.
--               Own routines are the existing routines rows with source = 'custom'.
--
-- Deleted with the routine (foreign key) and by deleteUserData (src/platform.ts).
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS plan_entries (
  id                INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  user_id           INT UNSIGNED      NOT NULL,
  routine_id        INT UNSIGNED      NOT NULL,
  weekday           TINYINT UNSIGNED  NULL,
  start_minute      SMALLINT UNSIGNED NOT NULL,
  duration_minutes  SMALLINT UNSIGNED NOT NULL,
  created_at        DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_plan_entries_user (user_id, weekday, start_minute),
  CONSTRAINT fk_plan_routine FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- workout 0001 — Workout tracker setup (the plugin's OWN database, ADR 0007)
--
-- Apply to the workout database (u962314563_workout), NOT the platform database:
--   pnpm db:migrate --plugin workout     (uses WORKOUT_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- Only the migration log for now: the app is a placeholder and stores nothing yet. The tables
-- for workouts, sets and exercises come with the first real feature (0002 onwards).
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(100) NOT NULL,
  applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0001_workout_setup');

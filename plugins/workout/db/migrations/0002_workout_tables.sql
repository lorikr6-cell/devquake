-- =============================================================================
-- workout 0002 — Profiles, routines and guided workouts (the plugin's OWN database, ADR 0013)
--
-- Apply to the workout database (u962314563_workout), NOT the platform database:
--   pnpm db:migrate --plugin workout     (uses WORKOUT_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- Weights are kg, heights cm, distances metres; the pages convert to lb / ft / miles.
-- Times are UTC (ADR 0010). user_id is the DevQuake account id: every row with one is deleted
-- by deleteUserData (src/platform.ts) when the account is deleted or unsubscribes.
-- The built-in equipment and exercises come with 0003_workout_seed.sql.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS equipment (
  slug        VARCHAR(32)       NOT NULL,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  home        TINYINT(1)        NOT NULL DEFAULT 1,  -- offered in the "at home" list
  icon_svg    TEXT              NOT NULL,            -- 24 × 24 line icon, drawn for this app
  PRIMARY KEY (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Built-in exercises have a slug (their texts are in the app's translations) and no user_id.
CREATE TABLE IF NOT EXISTS exercises (
  id               INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  slug             VARCHAR(48)       NULL,
  user_id          INT UNSIGNED      NULL,
  name             VARCHAR(80)       NULL,
  role             ENUM('warmup','strength','core','cardio') NOT NULL,
  pattern          VARCHAR(16)       NOT NULL,
  metric           ENUM('reps','time','distance') NOT NULL,
  places           SET('gym','home','outside') NOT NULL,
  muscles          SET('chest','back','shoulders','biceps','triceps','core','glutes','quads',
                       'hamstrings','calves','full_body') NOT NULL DEFAULT '',
  difficulty       TINYINT UNSIGNED  NOT NULL DEFAULT 1,
  low_impact       TINYINT(1)        NOT NULL DEFAULT 1,
  weighted         TINYINT(1)        NOT NULL DEFAULT 0,
  seconds_per_rep  DECIMAL(4,1)      NOT NULL DEFAULT 3.0,
  speed_mps        DECIMAL(4,2)      NOT NULL DEFAULT 0.00,
  met              DECIMAL(4,1)      NOT NULL DEFAULT 3.8,
  motion           VARCHAR(32)       NULL,   -- stick-figure animation (src/illustrations)
  prop             VARCHAR(16)       NULL,
  sort_order       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  retired_at       DATETIME          NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_exercises_slug (slug),
  KEY ix_exercises_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Equipment an exercise needs (all of it).
CREATE TABLE IF NOT EXISTS exercise_equipment (
  exercise_id     INT UNSIGNED NOT NULL,
  equipment_slug  VARCHAR(32)  NOT NULL,
  PRIMARY KEY (exercise_id, equipment_slug),
  CONSTRAINT fk_exeq_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
  CONSTRAINT fk_exeq_equipment FOREIGN KEY (equipment_slug) REFERENCES equipment (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Only what the suggestions need: the birth year, not a birth date; no sex, no medical data.
CREATE TABLE IF NOT EXISTS profiles (
  user_id          INT UNSIGNED      NOT NULL,
  birth_year       SMALLINT UNSIGNED NOT NULL,
  height_cm        DECIMAL(5,1)      NOT NULL,
  weight_kg        DECIMAL(5,2)      NOT NULL,
  weight_unit      ENUM('kg','lb')   NOT NULL DEFAULT 'kg',
  height_unit      ENUM('cm','ft')   NOT NULL DEFAULT 'cm',
  experience       ENUM('beginner','intermediate','advanced') NOT NULL,
  goal             ENUM('strength','muscle','endurance','general','weight_loss') NOT NULL,
  days_per_week    TINYINT UNSIGNED  NOT NULL,
  session_minutes  SMALLINT UNSIGNED NOT NULL,
  low_impact       TINYINT(1)        NOT NULL DEFAULT 0,
  created_at       DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_locations (
  user_id   INT UNSIGNED NOT NULL,
  location  ENUM('gym','home','outside') NOT NULL,
  PRIMARY KEY (user_id, location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_equipment (
  user_id         INT UNSIGNED NOT NULL,
  equipment_slug  VARCHAR(32)  NOT NULL,
  PRIMARY KEY (user_id, equipment_slug),
  CONSTRAINT fk_ueq_equipment FOREIGN KEY (equipment_slug) REFERENCES equipment (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Generated routines have a template key (their name is translated); own routines a name.
-- Generating again archives the previous generated ones of that place.
CREATE TABLE IF NOT EXISTS routines (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED NOT NULL,
  location     ENUM('gym','home','outside') NOT NULL,
  source       ENUM('generated','custom') NOT NULL,
  template     VARCHAR(32)  NULL,
  name         VARCHAR(80)  NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at  DATETIME     NULL,
  PRIMARY KEY (id),
  KEY ix_routines_user (user_id, archived_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS routine_items (
  id            INT UNSIGNED       NOT NULL AUTO_INCREMENT,
  routine_id    INT UNSIGNED       NOT NULL,
  position      SMALLINT UNSIGNED  NOT NULL,
  phase         ENUM('warmup','main') NOT NULL DEFAULT 'main',
  exercise_id   INT UNSIGNED       NOT NULL,
  sets          TINYINT UNSIGNED   NOT NULL,
  reps_min      SMALLINT UNSIGNED  NULL,
  reps_max      SMALLINT UNSIGNED  NULL,
  target_reps   SMALLINT UNSIGNED  NULL,
  seconds       MEDIUMINT UNSIGNED NULL,
  distance_m    MEDIUMINT UNSIGNED NULL,
  rest_seconds  SMALLINT UNSIGNED  NOT NULL DEFAULT 60,
  PRIMARY KEY (id),
  UNIQUE KEY uq_routine_items_position (routine_id, position),
  CONSTRAINT fk_ritems_routine FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE CASCADE,
  CONSTRAINT fk_ritems_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A workout. Starting one copies the routine into session_items with that day's targets, so
-- changing the routine later never changes a workout.
CREATE TABLE IF NOT EXISTS sessions (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED NOT NULL,
  routine_id      INT UNSIGNED NULL,
  location        ENUM('gym','home','outside') NOT NULL,
  template        VARCHAR(32)  NULL,
  routine_name    VARCHAR(80)  NULL,
  body_weight_kg  DECIMAL(5,2) NOT NULL,          -- for the calorie estimate
  status          ENUM('active','finished') NOT NULL DEFAULT 'active',
  started_at      DATETIME(3)  NOT NULL,
  finished_at     DATETIME(3)  NULL,
  kcal            DECIMAL(6,1) NULL,
  PRIMARY KEY (id),
  KEY ix_sessions_user (user_id, status, finished_at),
  CONSTRAINT fk_sessions_routine FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One exercise of a workout: its targets, and when it started and ended (server time, or the
-- phone's time corrected to the server's when the change was sent late).
CREATE TABLE IF NOT EXISTS session_items (
  id                 INT UNSIGNED       NOT NULL AUTO_INCREMENT,
  session_id         INT UNSIGNED       NOT NULL,
  position           SMALLINT UNSIGNED  NOT NULL,
  phase              ENUM('warmup','main') NOT NULL DEFAULT 'main',
  exercise_id        INT UNSIGNED       NOT NULL,
  sets               TINYINT UNSIGNED   NOT NULL,
  reps_min           SMALLINT UNSIGNED  NULL,
  reps_max           SMALLINT UNSIGNED  NULL,
  target_reps        SMALLINT UNSIGNED  NULL,
  target_seconds     MEDIUMINT UNSIGNED NULL,
  target_distance_m  MEDIUMINT UNSIGNED NULL,
  target_weight_kg   DECIMAL(6,2)       NULL,
  rest_seconds       SMALLINT UNSIGNED  NOT NULL DEFAULT 60,
  started_at         DATETIME(3)        NULL,
  ended_at           DATETIME(3)        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_session_items_position (session_id, position),
  KEY ix_session_items_exercise (exercise_id, ended_at),
  CONSTRAINT fk_sitems_session FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
  CONSTRAINT fk_sitems_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- What the person did in each set. Saved while typing (after 10 s without changes) and when
-- the set is done; client_at (epoch ms) keeps an older, late request from overwriting newer data.
CREATE TABLE IF NOT EXISTS session_sets (
  session_item_id  INT UNSIGNED       NOT NULL,
  set_no           TINYINT UNSIGNED   NOT NULL,
  reps             SMALLINT UNSIGNED  NULL,
  seconds          MEDIUMINT UNSIGNED NULL,
  distance_m       MEDIUMINT UNSIGNED NULL,
  weight_kg        DECIMAL(6,2)       NULL,
  done_at          DATETIME(3)        NULL,
  client_at        BIGINT UNSIGNED    NOT NULL DEFAULT 0,
  PRIMARY KEY (session_item_id, set_no),
  CONSTRAINT fk_ssets_item FOREIGN KEY (session_item_id) REFERENCES session_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0002_workout_tables');

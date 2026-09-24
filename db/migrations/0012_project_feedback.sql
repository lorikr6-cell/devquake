-- =============================================================================
-- 0012 — Project likes and ratings
--
-- Signed-in users can like any public project and rate the ones that are live on two
-- scales from 1 to 5: quality and how useful it is for them. One row per user and project;
-- the landing page shows live projects first, then the most liked.
--
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS project_feedback (
  user_id     INT UNSIGNED     NOT NULL,
  project_id  INT UNSIGNED     NOT NULL,
  liked       TINYINT(1)       NOT NULL DEFAULT 0,
  -- 1..5, NULL = not rated (validated by the app).
  quality     TINYINT UNSIGNED NULL,
  usefulness  TINYINT UNSIGNED NULL,
  created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, project_id),
  KEY ix_project_feedback_project (project_id, liked),
  CONSTRAINT fk_project_feedback_user    FOREIGN KEY (user_id)    REFERENCES users (id)    ON DELETE CASCADE,
  CONSTRAINT fk_project_feedback_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0012_project_feedback');

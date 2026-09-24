-- =============================================================================
-- 0010 — Project subscriptions
--
-- A signed-in user subscribes to a public project from the landing page or their account.
-- Access to a project's app (<plugin_id>.devquake.com) is granted to its subscribers, users
-- the owner assigned to it (user_projects) and admins — and only while the app is online.
-- Unsubscribing removes the access again.
--
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS project_subscriptions (
  user_id     INT UNSIGNED NOT NULL,
  project_id  INT UNSIGNED NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, project_id),
  KEY ix_project_subscriptions_project (project_id),
  CONSTRAINT fk_project_subscriptions_user    FOREIGN KEY (user_id)    REFERENCES users (id)    ON DELETE CASCADE,
  CONSTRAINT fk_project_subscriptions_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0010_project_subscriptions');

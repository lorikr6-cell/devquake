-- =============================================================================
-- 0002 — Projects, ideas and their progress history
--
-- projects      groups of work: the platform itself, a plugin, or anything else
-- ideas         one idea / feature with a status, priority and progress (0-100)
-- idea_updates  append-only timeline: every status/progress change and note
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS projects (
  id           INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  slug         VARCHAR(64)       NOT NULL,
  name         VARCHAR(120)      NOT NULL,
  description  TEXT              NULL,
  kind         ENUM('platform','plugin','other') NOT NULL DEFAULT 'other',
  -- Plugin id / subdomain when kind = 'plugin' (e.g. 'bills' -> bills.devquake.com).
  plugin_id    VARCHAR(64)       NULL,
  status       ENUM('active','paused','completed','archived') NOT NULL DEFAULT 'active',
  sort_order   SMALLINT          NOT NULL DEFAULT 0,
  created_by   INT UNSIGNED      NULL,
  created_at   DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_projects_slug (slug),
  KEY ix_projects_status (status, sort_order),
  CONSTRAINT fk_projects_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ideas (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  project_id    INT UNSIGNED      NULL,
  title         VARCHAR(200)      NOT NULL,
  summary       TEXT              NULL,
  status        ENUM('idea','planned','in_progress','blocked','done','dropped') NOT NULL DEFAULT 'idea',
  priority      ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  progress      TINYINT UNSIGNED  NOT NULL DEFAULT 0,
  target_date   DATE              NULL,
  started_at    DATETIME          NULL,
  completed_at  DATETIME          NULL,
  created_by    INT UNSIGNED      NULL,
  updated_by    INT UNSIGNED      NULL,
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_ideas_status (status, priority),
  KEY ix_ideas_project (project_id, status),
  KEY ix_ideas_updated (updated_at),
  CONSTRAINT ck_ideas_progress CHECK (progress <= 100),
  CONSTRAINT fk_ideas_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL,
  CONSTRAINT fk_ideas_creator FOREIGN KEY (created_by) REFERENCES users (id)    ON DELETE SET NULL,
  CONSTRAINT fk_ideas_updater FOREIGN KEY (updated_by) REFERENCES users (id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS idea_updates (
  id            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  idea_id       INT UNSIGNED     NOT NULL,
  author_id     INT UNSIGNED     NULL,
  note          TEXT             NULL,
  old_status    VARCHAR(20)      NULL,
  new_status    VARCHAR(20)      NULL,
  old_progress  TINYINT UNSIGNED NULL,
  new_progress  TINYINT UNSIGNED NULL,
  created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_idea_updates_idea (idea_id, created_at),
  CONSTRAINT fk_idea_updates_idea   FOREIGN KEY (idea_id)   REFERENCES ideas (id) ON DELETE CASCADE,
  CONSTRAINT fk_idea_updates_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0002_projects_and_ideas');

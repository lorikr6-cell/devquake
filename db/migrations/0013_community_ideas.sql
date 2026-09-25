-- =============================================================================
-- 0013 — Community ideas
--
-- Signed-in users propose ideas (for a project, or for a new app) with an optional picture.
-- Public ideas are visible to every signed-in user; the author decides whether others may vote
-- and comment. The site owner/admins answer with a status and a note, hide or delete ideas and
-- comments, and can add an idea to the roadmap (the `ideas` table).
--
-- Everything is removed with the author's account (ON DELETE CASCADE).
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS community_ideas (
  id                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  author_user_id    INT UNSIGNED  NOT NULL,
  project_id        INT UNSIGNED  NULL,
  title             VARCHAR(200)  NOT NULL,
  description       TEXT          NULL,
  is_public         TINYINT(1)    NOT NULL DEFAULT 1,
  votes_enabled     TINYINT(1)    NOT NULL DEFAULT 1,
  comments_enabled  TINYINT(1)    NOT NULL DEFAULT 1,
  status            ENUM('open','under_review','accepted','declined') NOT NULL DEFAULT 'open',
  -- Public answer from the site owner/admins.
  staff_note        VARCHAR(500)  NULL,
  -- Roadmap idea created from this one ("Add to roadmap").
  roadmap_idea_id   INT UNSIGNED  NULL,
  -- Hidden by moderation: only the author and staff still see it.
  hidden_at         DATETIME      NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_community_ideas_public (is_public, hidden_at, created_at),
  KEY ix_community_ideas_author (author_user_id),
  CONSTRAINT fk_community_ideas_author  FOREIGN KEY (author_user_id)  REFERENCES users (id)    ON DELETE CASCADE,
  CONSTRAINT fk_community_ideas_project FOREIGN KEY (project_id)      REFERENCES projects (id) ON DELETE SET NULL,
  CONSTRAINT fk_community_ideas_roadmap FOREIGN KEY (roadmap_idea_id) REFERENCES ideas (id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS community_idea_images (
  idea_id     INT UNSIGNED  NOT NULL,
  mime        VARCHAR(20)   NOT NULL,
  data        MEDIUMBLOB    NOT NULL,
  bytes       INT UNSIGNED  NOT NULL,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idea_id),
  CONSTRAINT fk_community_idea_images_idea FOREIGN KEY (idea_id) REFERENCES community_ideas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS community_idea_votes (
  idea_id     INT UNSIGNED  NOT NULL,
  user_id     INT UNSIGNED  NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idea_id, user_id),
  KEY ix_community_idea_votes_user (user_id),
  CONSTRAINT fk_community_idea_votes_idea FOREIGN KEY (idea_id) REFERENCES community_ideas (id) ON DELETE CASCADE,
  CONSTRAINT fk_community_idea_votes_user FOREIGN KEY (user_id) REFERENCES users (id)           ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS community_idea_comments (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  idea_id     INT UNSIGNED  NOT NULL,
  user_id     INT UNSIGNED  NOT NULL,
  body        TEXT          NOT NULL,
  hidden_at   DATETIME      NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_community_idea_comments_idea (idea_id, created_at),
  KEY ix_community_idea_comments_user (user_id, created_at),
  CONSTRAINT fk_community_idea_comments_idea FOREIGN KEY (idea_id) REFERENCES community_ideas (id) ON DELETE CASCADE,
  CONSTRAINT fk_community_idea_comments_user FOREIGN KEY (user_id) REFERENCES users (id)           ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0013_community_ideas');

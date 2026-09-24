-- =============================================================================
-- 0008 — Public / private visibility for projects and ideas
--
-- is_public = 1  shown on the landing page, in its statistics and in the sitemap.
-- is_public = 0  private: only visible in /admin-cp. A private project can never be online.
--
-- New rows default to private, so nothing is published by accident. Rows that exist when this
-- migration first completes were already public on the landing page and stay public.
-- A public idea is only shown if its project is public too.
--
-- SAFE TO RE-RUN (e.g. importing it twice in phpMyAdmin): columns are only added when missing,
-- and the "make existing rows public" step only runs until the migration is recorded as done,
-- so it never overwrites visibility you changed later in /admin-cp.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_0008_done := (SELECT COUNT(*) FROM schema_migrations WHERE version = '0008_visibility');

-- projects.is_public (only if missing)
SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'is_public') = 0,
  'ALTER TABLE projects ADD COLUMN is_public TINYINT(1) NOT NULL DEFAULT 0 AFTER is_online',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

-- ideas.is_public (only if missing)
SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ideas' AND COLUMN_NAME = 'is_public') = 0,
  'ALTER TABLE ideas ADD COLUMN is_public TINYINT(1) NOT NULL DEFAULT 0 AFTER progress',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

-- Existing rows stay public — only while this migration has not completed before.
SET @dq_sql := IF(@dq_0008_done = 0, 'UPDATE projects SET is_public = 1', 'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(@dq_0008_done = 0, 'UPDATE ideas SET is_public = 1', 'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0008_visibility');

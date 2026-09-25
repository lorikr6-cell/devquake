-- =============================================================================
-- 0014 — Project logos (generated avatars)
--
-- Every project shows a generated logo: its initials (max 3 letters) on a coloured tile with a
-- small symbol. Both are automatic; these columns keep a choice made by an admin in /admin-cp
-- or by a user who manages the project (user_projects.project_role = 'manager').
--
-- avatar_color   '#RRGGBB', or NULL for the automatic colour
-- avatar_symbol  a symbol name from the app's list (e.g. 'cart'), or NULL for the automatic one
--
-- SAFE TO RE-RUN: columns are only added when missing.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'avatar_color') = 0,
  'ALTER TABLE projects ADD COLUMN avatar_color CHAR(7) NULL AFTER description,
     ADD COLUMN avatar_symbol VARCHAR(24) NULL AFTER avatar_color',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0014_project_avatars');

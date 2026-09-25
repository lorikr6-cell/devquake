-- =============================================================================
-- 0019 — The theme a member last chose (ADR 0017)
--
-- users.theme   'adaptive', 'light', 'dark' or 'custom-<id>' (one of their custom themes or one
--               shared with them); NULL = never chosen. Set whenever a signed-in member picks
--               a theme, and applied again at every sign-in, on any device.
--
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'theme') = 0,
  'ALTER TABLE users ADD COLUMN theme VARCHAR(20) NULL AFTER preferred_locale',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0019_user_theme');

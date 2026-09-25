-- =============================================================================
-- 0016 — Languages (ADR 0011)
--
-- users.locale             the language a member last used on DevQuake ('en', 'de', 'ro',
--                          'hu'); emails to them are written in it. NULL until known.
-- contact_messages.locale  the language a message was written in, so the reply email to a
--                          visitor without an account is in the same language.
--
-- SAFE TO RE-RUN: columns are only added when missing.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'locale') = 0,
  'ALTER TABLE users ADD COLUMN locale CHAR(2) NULL AFTER display_name',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact_messages' AND COLUMN_NAME = 'locale') = 0,
  'ALTER TABLE contact_messages ADD COLUMN locale CHAR(2) NULL AFTER message',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0016_languages');

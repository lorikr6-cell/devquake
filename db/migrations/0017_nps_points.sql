-- =============================================================================
-- 0017 — NPS points unlock apps (ADR 0012)
--
-- users.nps                      now the member's AVAILABLE points: every account starts with 3,
--                                every activated referral adds 1, subscribing to an app spends
--                                the app's cost (no refund on unsubscribing).
-- projects.nps_cost              points needed to subscribe to the project's app, set by the
--                                owner in /admin-cp (0 = FREE). Existing projects start FREE.
-- project_subscriptions.nps_spent points paid for that subscription (0 for subscriptions made
--                                before this migration: they stay free).
--
-- One-time credit: every existing account gets +3 points, the starting points new accounts
-- receive from now on. It runs only while this migration is not yet recorded, so re-running
-- the file never credits twice.
--
-- SAFE TO RE-RUN: columns are only added when missing; the credit is guarded.
-- =============================================================================

SET NAMES utf8mb4;

-- The one-time +3 for existing accounts (before new accounts start at 3, so nobody gets 6).
UPDATE users SET nps = nps + 3
 WHERE (SELECT COUNT(*) FROM schema_migrations WHERE version = '0017_nps_points') = 0;

-- New accounts start with 3 points.
ALTER TABLE users ALTER COLUMN nps SET DEFAULT 3;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'nps_cost') = 0,
  'ALTER TABLE projects ADD COLUMN nps_cost INT UNSIGNED NOT NULL DEFAULT 0 AFTER is_public',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_subscriptions' AND COLUMN_NAME = 'nps_spent') = 0,
  'ALTER TABLE project_subscriptions ADD COLUMN nps_spent INT UNSIGNED NOT NULL DEFAULT 0',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0017_nps_points');

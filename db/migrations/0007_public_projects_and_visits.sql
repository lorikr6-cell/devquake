-- =============================================================================
-- 0007 — Public project showcase and cookie-free visitor statistics
--
-- projects.is_online  the app on <plugin_id>.devquake.com may be visited. Set by an admin
--                     in /admin-cp/projects once the subdomain exists. Offline apps are
--                     listed on the landing page but not reachable.
-- visit_salts         one random salt per day; deleted the next day, so visitor hashes
--                     can no longer be linked to an IP address (anonymous counting).
-- site_visitors_daily one row per (day, anonymous visitor hash) for unique counts.
-- site_stats_daily    page views per day (aggregate only).
--
-- SAFE TO RE-RUN: the column is only added when missing; every other statement is idempotent.
-- =============================================================================

SET NAMES utf8mb4;

-- projects.is_online (only if missing)
SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'is_online') = 0,
  'ALTER TABLE projects ADD COLUMN is_online TINYINT(1) NOT NULL DEFAULT 0 AFTER status',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

-- Public scope descriptions for the seeded roadmap projects (only if still the doc path).
UPDATE projects SET description = 'The shared foundation every app builds on: one account for all apps, roles, the database, email, security and this control panel.'
 WHERE slug = 'platform' AND (description IS NULL OR description LIKE 'Accounts, roles, database%');
UPDATE projects SET description = 'Share utility costs at an address: members submit meter readings, see their history, and whether the bill and their own share are paid.'
 WHERE slug = 'bills' AND description LIKE 'docs/plugins/ideas/%';
UPDATE projects SET description = 'Log workouts set by set, follow your progress, and compete on leaderboards per exercise.'
 WHERE slug = 'workout' AND description LIKE 'docs/plugins/ideas/%';
UPDATE projects SET description = 'A realtime event service: apps send actions and connected clients receive live updates and push notifications.'
 WHERE slug = 'pulse' AND description LIKE 'docs/plugins/ideas/%';
UPDATE projects SET description = 'Shopping lists shared live with family and friends: instant updates, push notifications, prices and list totals.'
 WHERE slug = 'shopping' AND description LIKE 'docs/plugins/ideas/%';
UPDATE projects SET description = 'A game manager for dart clubs: boards with QR codes, live scoring on an interactive dartboard and checkout suggestions.'
 WHERE slug = 'darts' AND description LIKE 'docs/plugins/ideas/%';

CREATE TABLE IF NOT EXISTS visit_salts (
  day   DATE     NOT NULL,
  salt  CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_visitors_daily (
  day           DATE     NOT NULL,
  visitor_hash  CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (day, visitor_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_stats_daily (
  day         DATE         NOT NULL,
  page_views  INT UNSIGNED NOT NULL DEFAULT 0,
  visitors    INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0007_public_projects_and_visits');

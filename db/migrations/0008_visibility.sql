-- =============================================================================
-- 0008 — Public / private visibility for projects and ideas
--
-- is_public = 1  shown on the landing page, in its statistics and in the sitemap.
-- is_public = 0  private: only visible in /admin-cp. A private project can never be online.
--
-- New rows default to private, so nothing is published by accident. Rows that exist when this
-- migration runs were already public on the landing page and stay public.
-- A public idea is only shown if its project is public too.
--
-- NOTE: the ALTER TABLE statements are not re-runnable; skip them if they already succeeded.
-- =============================================================================

SET NAMES utf8mb4;

ALTER TABLE projects ADD COLUMN is_public TINYINT(1) NOT NULL DEFAULT 0 AFTER is_online;
ALTER TABLE ideas    ADD COLUMN is_public TINYINT(1) NOT NULL DEFAULT 0 AFTER progress;

UPDATE projects SET is_public = 1;
UPDATE ideas    SET is_public = 1;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0008_visibility');

-- =============================================================================
-- 0024 — The utility bill manager is the "utilities" app (utilities.devquake.com), built v0.1.0
--
-- The roadmap called it "bills" (seeded in 0004 as project slug 'bills', plugin_id 'bills').
-- The app was built as plugin "utilities", on the existing subdomain utilities.devquake.com, and
-- app access is matched on projects.plugin_id, so the project must point at 'utilities':
--   * no 'utilities' project yet  → the 'bills' project is renamed (slug and plugin_id);
--   * a 'utilities' project exists → it gets plugin_id 'utilities' (if empty), the 'bills'
--     project's ideas move to it and the 'bills' project is archived.
-- Then the "Build the ... plugin" idea is marked done (100 %), logged in idea_updates. The
-- landing page shows a project's progress as the average of its ideas.
-- The project is NOT put online here (projects.is_online): do that in /admin-cp/projects once
-- the app's database exists on Hostinger (UTILITIES_DB_*, pnpm db:migrate --plugin utilities).
--
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

-- Case 1: rename the 'bills' project when there is no 'utilities' project.
UPDATE projects b LEFT JOIN projects u ON u.slug = 'utilities'
   SET b.slug = 'utilities', b.plugin_id = 'utilities'
 WHERE b.slug = 'bills' AND u.id IS NULL;

-- Case 2: a 'utilities' project already exists.
UPDATE projects SET plugin_id = 'utilities'
 WHERE slug = 'utilities' AND (plugin_id IS NULL OR plugin_id = '' OR plugin_id = 'bills');

UPDATE ideas i
  JOIN projects b ON b.id = i.project_id AND b.slug = 'bills'
  JOIN projects u ON u.slug = 'utilities'
   SET i.project_id = u.id;

UPDATE projects SET status = 'archived', plugin_id = NULL
 WHERE slug = 'bills' AND status <> 'archived';

-- The build idea: renamed, done at 100 %, with a history entry (only once).
UPDATE ideas i JOIN projects p ON p.id = i.project_id AND p.slug = 'utilities'
   SET i.title = 'Build the utilities plugin'
 WHERE i.title = 'Build the bills plugin';

INSERT INTO idea_updates (idea_id, note, old_status, new_status, old_progress, new_progress)
SELECT i.id,
       'Built v0.1.0 (utilities.devquake.com): utilities and monthly bills, PDF reading, sharing by invite or referral, meter readings with photos, split by consumption with carry-over, payments, comments, calendar and statistics, in four languages.',
       i.status, 'done', i.progress, 100
  FROM ideas i JOIN projects p ON p.id = i.project_id
 WHERE p.slug = 'utilities' AND i.title = 'Build the utilities plugin' AND i.status <> 'done';

UPDATE ideas i JOIN projects p ON p.id = i.project_id
   SET i.status = 'done',
       i.progress = 100,
       i.summary = 'Built in v0.1.0; see plugins/utilities/README.md',
       i.started_at = COALESCE(i.started_at, UTC_TIMESTAMP()),
       i.completed_at = COALESCE(i.completed_at, UTC_TIMESTAMP())
 WHERE p.slug = 'utilities' AND i.title = 'Build the utilities plugin' AND i.status <> 'done';

INSERT IGNORE INTO schema_migrations (version) VALUES ('0024_utilities_project');

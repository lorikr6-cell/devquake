-- =============================================================================
-- 0004 — Seed data: platform roles, projects and ideas from docs/roadmap.md
-- Safe to re-run: roles/projects use INSERT IGNORE on unique keys, and ideas are
-- only seeded while the ideas table is empty.
-- The first admin user is NOT created here; use `pnpm admin:create` (db/README.md).
-- =============================================================================

SET NAMES utf8mb4;

INSERT IGNORE INTO roles (code, scope, name, description) VALUES
  ('platform.admin', 'platform', 'Platform administrator', 'Full access to /admin-cp and every plugin'),
  ('platform.user',  'platform', 'User',                   'Regular signed-in account');

INSERT IGNORE INTO projects (slug, name, kind, plugin_id, sort_order, description) VALUES
  ('platform', 'Platform foundation', 'platform', NULL,       0, 'Accounts, roles, database, email, realtime and other shared capabilities'),
  ('bills',    'Utility bill manager', 'plugin',  'bills',    10, 'docs/plugins/ideas/bills.md'),
  ('workout',  'Workout tracker',      'plugin',  'workout',  20, 'docs/plugins/ideas/workout.md'),
  ('pulse',    'Realtime events API',  'plugin',  'pulse',    30, 'docs/plugins/ideas/pulse.md'),
  ('shopping', 'Shared shopping lists','plugin',  'shopping', 40, 'docs/plugins/ideas/shopping.md'),
  ('darts',    'Dart game manager',    'plugin',  'darts',    50, 'docs/plugins/ideas/darts.md');

INSERT INTO ideas (project_id, title, summary, status, priority, progress)
SELECT p.id, s.title, s.summary, s.status, s.priority, s.progress
FROM (
            SELECT 'platform' AS slug, 'Admin control panel (/admin-cp)' AS title, 'Owner login, ideas dashboard and activity log' AS summary, 'in_progress' AS status, 'high' AS priority, 60 AS progress
  UNION ALL SELECT 'platform', 'Accounts and login across subdomains', 'Session cookie on .devquake.com, one account for all plugins', 'planned', 'high', 0
  UNION ALL SELECT 'platform', 'Roles (platform and per plugin)', 'platform.admin plus per-plugin roles such as bills.admin', 'planned', 'high', 10
  UNION ALL SELECT 'platform', 'Database (MySQL on Hostinger)', 'Connection pool, migrations, activity log', 'in_progress', 'high', 50
  UNION ALL SELECT 'platform', 'Email', 'Invitations, password reset, reminders', 'idea', 'medium', 0
  UNION ALL SELECT 'platform', 'Realtime spike on Hostinger', 'Test WebSockets and SSE on managed Node.js; record the result in an ADR', 'idea', 'medium', 0
  UNION ALL SELECT 'platform', 'Consent and privacy (GDPR)', 'Cookie consent, privacy policy, data export and deletion', 'idea', 'medium', 0
  UNION ALL SELECT 'bills',    'Build the bills plugin', 'See docs/plugins/ideas/bills.md', 'idea', 'high', 0
  UNION ALL SELECT 'workout',  'Build the workout plugin', 'See docs/plugins/ideas/workout.md', 'idea', 'medium', 0
  UNION ALL SELECT 'pulse',    'Build the pulse plugin', 'See docs/plugins/ideas/pulse.md', 'idea', 'medium', 0
  UNION ALL SELECT 'shopping', 'Build the shopping plugin', 'See docs/plugins/ideas/shopping.md', 'idea', 'low', 0
  UNION ALL SELECT 'darts',    'Build the darts plugin', 'See docs/plugins/ideas/darts.md', 'idea', 'low', 0
) AS s
JOIN projects p ON p.slug = s.slug
WHERE NOT EXISTS (SELECT 1 FROM (SELECT id FROM ideas LIMIT 1) AS existing);

INSERT IGNORE INTO schema_migrations (version) VALUES ('0004_seed_roles_and_roadmap');

-- =============================================================================
-- 0003 — Activity log for the whole site (host, admin panel and every plugin)
--
-- source   who wrote the entry: 'host', 'admin-cp', or a plugin id ('bills', ...)
-- level    severity; 'security' marks auth events (logins, lockouts, denials)
-- action   dotted verb, e.g. 'auth.login.failed', 'idea.updated', 'api.error'
-- entity   optional subject of the action (entity_type + entity_id)
--
-- No foreign key on actor_user_id on purpose: log rows must survive user deletion
-- and inserts must stay cheap. Prune old rows with the statement at the bottom.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS activity_log (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  occurred_at    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  source         VARCHAR(64)     NOT NULL,
  level          ENUM('debug','info','notice','warning','error','security') NOT NULL DEFAULT 'info',
  action         VARCHAR(100)    NOT NULL,
  message        VARCHAR(500)    NULL,
  actor_user_id  INT UNSIGNED    NULL,
  entity_type    VARCHAR(64)     NULL,
  entity_id      VARCHAR(64)     NULL,
  ip             VARCHAR(45)     NULL,
  user_agent     VARCHAR(512)    NULL,
  request_path   VARCHAR(512)    NULL,
  metadata       JSON            NULL,
  PRIMARY KEY (id),
  KEY ix_activity_time (occurred_at),
  KEY ix_activity_source_time (source, occurred_at),
  KEY ix_activity_level_time (level, occurred_at),
  KEY ix_activity_action (action),
  KEY ix_activity_actor (actor_user_id, occurred_at),
  KEY ix_activity_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0003_activity_log');

-- Retention (run manually or from a cron job; not executed by this migration):
--   DELETE FROM activity_log   WHERE occurred_at < UTC_TIMESTAMP() - INTERVAL 180 DAY AND level <> 'security';
--   DELETE FROM login_attempts WHERE created_at  < UTC_TIMESTAMP() - INTERVAL 90 DAY;
--   DELETE FROM sessions       WHERE expires_at  < UTC_TIMESTAMP() - INTERVAL 7 DAY;

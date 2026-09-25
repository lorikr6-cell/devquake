-- =============================================================================
-- 0015 — Replies to contact messages
--
-- Signed-in members write to DevQuake from their account (name and email come from the
-- account) and see their messages with the owner's replies there. The owner answers in
-- /admin-cp/messages; every reply is also emailed to the sender (so visitors who wrote without
-- an account get it too). Deleting a message deletes its replies.
--
-- contact_messages.user_seen_at  when the member last opened their messages: replies newer than
--                                this are shown as new (and counted in the account menu).
--
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS contact_replies (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  message_id      BIGINT UNSIGNED NOT NULL,
  author_user_id  INT UNSIGNED    NULL,
  body            TEXT            NOT NULL,
  emailed         TINYINT(1)      NOT NULL DEFAULT 0,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_contact_replies_message (message_id, created_at),
  CONSTRAINT fk_contact_replies_message FOREIGN KEY (message_id) REFERENCES contact_messages (id) ON DELETE CASCADE,
  CONSTRAINT fk_contact_replies_author FOREIGN KEY (author_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact_messages' AND COLUMN_NAME = 'user_seen_at') = 0,
  'ALTER TABLE contact_messages ADD COLUMN user_seen_at DATETIME NULL AFTER emailed',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0015_message_replies');

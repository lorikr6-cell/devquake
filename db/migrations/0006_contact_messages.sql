-- =============================================================================
-- 0006 — Messages sent through the contact form on the landing page.
-- Each message is also emailed to contact@devquake.com (Reply-To: the sender).
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS contact_messages (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id     INT UNSIGNED    NULL,
  name        VARCHAR(100)    NOT NULL,
  email       VARCHAR(254)    NOT NULL,
  subject     VARCHAR(150)    NULL,
  message     TEXT            NOT NULL,
  ip          VARCHAR(45)     NULL,
  user_agent  VARCHAR(512)    NULL,
  status      ENUM('new','read','archived') NOT NULL DEFAULT 'new',
  emailed     TINYINT(1)      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_contact_messages_status (status, created_at),
  KEY ix_contact_messages_ip (ip, created_at),
  CONSTRAINT fk_contact_messages_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0006_contact_messages');

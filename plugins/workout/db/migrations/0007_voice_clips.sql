-- =============================================================================
-- workout 0007 — Natural coach voices: cached audio
--
-- voice_clips: what the voice coach says, generated once by the text-to-speech service
-- (Microsoft Azure neural voices, WORKOUT_TTS_KEY) and then served from here. The coach's
-- sentences are templates with exercise names and numbers, so the same clips come back again and
-- again. No user id: a clip is the same for everyone who hears that sentence in that voice.
-- clip_key = SHA-256 of voice, style and text.
--
-- Apply to the workout database: pnpm db:migrate --plugin workout, or phpMyAdmin → Import.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS voice_clips (
  clip_key    CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  voice       VARCHAR(40)  NOT NULL,
  style       VARCHAR(16)  NOT NULL,
  spoken      VARCHAR(300) NOT NULL,
  mime        VARCHAR(20)  NOT NULL,
  data        MEDIUMBLOB   NOT NULL,
  bytes       INT UNSIGNED NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (clip_key),
  KEY ix_voice_clips_used (used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0007_voice_clips');

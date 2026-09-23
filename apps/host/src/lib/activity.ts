import 'server-only';
import { execute } from './db';

export type ActivityLevel = 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'security';

export interface ActivityEntry {
  /** 'host', 'admin-cp' or a plugin id */
  source: string;
  action: string;
  level?: ActivityLevel;
  message?: string;
  actorUserId?: number | null;
  entityType?: string;
  entityId?: string | number;
  ip?: string | null;
  userAgent?: string | null;
  requestPath?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Writes one row to activity_log. Never throws: logging must not break the request
 * that is being logged. Failures go to stderr (visible in Hostinger's runtime logs).
 */
export async function logActivity(entry: ActivityEntry): Promise<void> {
  try {
    await execute(
      `INSERT INTO activity_log
         (source, level, action, message, actor_user_id, entity_type, entity_id,
          ip, user_agent, request_path, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.source.slice(0, 64),
        entry.level ?? 'info',
        entry.action.slice(0, 100),
        entry.message?.slice(0, 500) ?? null,
        entry.actorUserId ?? null,
        entry.entityType ?? null,
        entry.entityId == null ? null : String(entry.entityId),
        entry.ip ?? null,
        entry.userAgent ?? null,
        entry.requestPath?.slice(0, 512) ?? null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
      ],
    );
  } catch (err) {
    console.error('[activity] failed to write log entry', entry.action, err);
  }
}

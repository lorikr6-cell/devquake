import 'server-only';
import { query, type Row } from './db';

/**
 * When each person was last active on DevQuake (ADR 0022): the later of their last sign-in and
 * the last use of any of their sessions (every page or app request with the session refreshes
 * it). ISO times in UTC; null when never. For the apps' scheduled work (e.g. the vault's
 * inactivity release).
 */
export async function lastActiveAt(userIds: number[]): Promise<Record<number, string | null>> {
  const ids = [...new Set(userIds.filter((id) => Number.isSafeInteger(id) && id > 0))].slice(
    0,
    500,
  );
  const result: Record<number, string | null> = {};
  for (const id of ids) result[id] = null;
  if (ids.length === 0) return result;
  const marks = ids.map(() => '?').join(', ');
  const rows = await query<Row & { id: number; at: Date | null }>(
    `SELECT u.id, GREATEST(COALESCE(u.last_login_at, '1970-01-01'),
                           COALESCE((SELECT MAX(s.last_seen_at) FROM sessions s WHERE s.user_id = u.id),
                                    '1970-01-01')) AS at
       FROM users u WHERE u.id IN (${marks})`,
    ids,
  );
  for (const r of rows) {
    const at = r.at ? new Date(r.at) : null;
    result[Number(r.id)] = at && at.getTime() > 0 ? at.toISOString() : null;
  }
  return result;
}

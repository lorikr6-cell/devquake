import 'server-only';
import { cache } from 'react';
import { logActivity } from './activity';
import { execute, query, queryOne, type Row } from './db';
import type { RequestInfo } from './request';
import {
  MAX_SHARES_PER_THEME,
  MAX_THEMES_PER_USER,
  parseThemeSettings,
  type ThemeSettings,
} from './custom-theme';

/**
 * Members' custom themes (ADR 0017, migration 0018). A theme belongs to the member who made it
 * and is visible to them and to the members they shared it with (by email address; only
 * existing, active accounts). Deleting a theme removes it for everyone; deleting an account
 * removes its themes and shares (foreign keys).
 */

export interface ThemeView {
  id: number;
  name: string;
  settings: ThemeSettings;
  /** Set on themes shared with the viewer: who made it. */
  ownerName?: string;
  /** Set on the viewer's own themes: who they shared it with. */
  sharedWith?: Array<{ userId: number; name: string }>;
}

export interface UserThemes {
  own: ThemeView[];
  shared: ThemeView[];
}

interface ThemeRow extends Row {
  id: number;
  user_id: number;
  name: string;
  settings: string;
  owner_name: string;
}

/** The viewer's own themes and the ones shared with them. Empty before migration 0018. */
export const listUserThemes = cache(async (userId: number): Promise<UserThemes> => {
  const rows = await query<ThemeRow>(
    `SELECT t.id, t.user_id, t.name, t.settings, u.display_name AS owner_name
       FROM user_themes t JOIN users u ON u.id = t.user_id
      WHERE t.user_id = ?
         OR t.id IN (SELECT theme_id FROM user_theme_shares WHERE user_id = ?)
      ORDER BY t.user_id = ? DESC, t.name`,
    [userId, userId, userId],
  ).catch(() => []);
  const ownIds = rows.filter((r) => r.user_id === userId).map((r) => r.id);
  const shares = ownIds.length
    ? await query<Row & { theme_id: number; user_id: number; display_name: string }>(
        `SELECT s.theme_id, s.user_id, u.display_name FROM user_theme_shares s
           JOIN users u ON u.id = s.user_id WHERE s.theme_id IN (?) ORDER BY u.display_name`,
        [ownIds],
      ).catch(() => [])
    : [];
  const result: UserThemes = { own: [], shared: [] };
  for (const r of rows) {
    const settings = parseThemeSettings(r.settings);
    if (!settings) continue;
    if (r.user_id === userId) {
      result.own.push({
        id: r.id,
        name: r.name,
        settings,
        sharedWith: shares
          .filter((s) => s.theme_id === r.id)
          .map((s) => ({ userId: s.user_id, name: s.display_name })),
      });
    } else {
      result.shared.push({ id: r.id, name: r.name, settings, ownerName: r.owner_name });
    }
  }
  return result;
});

/** A theme the viewer may use (own or shared with them); null otherwise. */
export async function themeForViewer(
  themeId: number,
  userId: number,
): Promise<ThemeSettings | null> {
  const row = await queryOne<Row & { settings: string }>(
    `SELECT t.settings FROM user_themes t
      WHERE t.id = ?
        AND (t.user_id = ?
             OR EXISTS (SELECT 1 FROM user_theme_shares s WHERE s.theme_id = t.id AND s.user_id = ?))`,
    [themeId, userId, userId],
  ).catch(() => null);
  return row ? parseThemeSettings(row.settings) : null;
}

export type SaveThemeResult = { ok: true; id: number } | { ok: false; error: 'limit' | 'missing' };

export async function saveTheme(
  userId: number,
  themeId: number | null,
  name: string,
  settings: ThemeSettings,
): Promise<SaveThemeResult> {
  const json = JSON.stringify(settings);
  if (themeId) {
    const updated = await execute(
      'UPDATE user_themes SET name = ?, settings = ? WHERE id = ? AND user_id = ?',
      [name, json, themeId, userId],
    );
    // affectedRows is 0 both for "not yours" and "nothing changed": check which.
    if (updated.affectedRows === 0) {
      const mine = await queryOne<Row & { id: number }>(
        'SELECT id FROM user_themes WHERE id = ? AND user_id = ?',
        [themeId, userId],
      );
      if (!mine) return { ok: false, error: 'missing' };
    }
    return { ok: true, id: themeId };
  }
  const count = await queryOne<Row & { n: number }>(
    'SELECT COUNT(*) AS n FROM user_themes WHERE user_id = ?',
    [userId],
  );
  if (Number(count?.n ?? 0) >= MAX_THEMES_PER_USER) return { ok: false, error: 'limit' };
  const inserted = await execute(
    'INSERT INTO user_themes (user_id, name, settings) VALUES (?, ?, ?)',
    [userId, name, json],
  );
  return { ok: true, id: inserted.insertId };
}

/** Deletes one of the member's themes (and its shares). */
export async function deleteTheme(userId: number, themeId: number): Promise<boolean> {
  const result = await execute('DELETE FROM user_themes WHERE id = ? AND user_id = ?', [
    themeId,
    userId,
  ]);
  return result.affectedRows === 1;
}

export type ShareResult =
  | { ok: true; name: string }
  | { ok: false; error: 'invalid' | 'missing' | 'self' | 'unknown' | 'limit' | 'throttled' };

/** Unknown addresses a member may try per hour (sharing tells whether an address has an account). */
const MAX_UNKNOWN_PER_HOUR = 10;

/**
 * Shares the member's theme with an existing, active account by email address. The address
 * must belong to a DevQuake member (as asked for); lookups of unknown addresses are limited.
 */
export async function shareTheme(
  ownerId: number,
  themeId: number,
  rawEmail: string,
  info: RequestInfo,
): Promise<ShareResult> {
  const email = rawEmail.trim().toLowerCase().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'invalid' };
  const theme = await queryOne<Row & { id: number; name: string }>(
    'SELECT id, name FROM user_themes WHERE id = ? AND user_id = ?',
    [themeId, ownerId],
  );
  if (!theme) return { ok: false, error: 'missing' };
  const unknown = await queryOne<Row & { n: number }>(
    `SELECT COUNT(*) AS n FROM activity_log
      WHERE action = 'theme.share.unknown' AND actor_user_id = ?
        AND occurred_at > UTC_TIMESTAMP() - INTERVAL 1 HOUR`,
    [ownerId],
  );
  if (Number(unknown?.n ?? 0) >= MAX_UNKNOWN_PER_HOUR) return { ok: false, error: 'throttled' };

  const target = await queryOne<Row & { id: number; display_name: string }>(
    "SELECT id, display_name FROM users WHERE email = ? AND status = 'active'",
    [email],
  );
  if (!target) {
    await logActivity({
      source: 'host',
      action: 'theme.share.unknown',
      actorUserId: ownerId,
      ip: info.ip,
      userAgent: info.userAgent,
    });
    return { ok: false, error: 'unknown' };
  }
  if (target.id === ownerId) return { ok: false, error: 'self' };
  const shares = await queryOne<Row & { n: number }>(
    'SELECT COUNT(*) AS n FROM user_theme_shares WHERE theme_id = ?',
    [themeId],
  );
  if (Number(shares?.n ?? 0) >= MAX_SHARES_PER_THEME) return { ok: false, error: 'limit' };
  await execute('INSERT IGNORE INTO user_theme_shares (theme_id, user_id) VALUES (?, ?)', [
    themeId,
    target.id,
  ]);
  await logActivity({
    source: 'host',
    action: 'theme.shared',
    message: theme.name,
    actorUserId: ownerId,
    entityType: 'user',
    entityId: target.id,
    ip: info.ip,
    userAgent: info.userAgent,
  });
  return { ok: true, name: target.display_name };
}

/** The owner stops sharing a theme with someone. */
export async function unshareTheme(ownerId: number, themeId: number, userId: number) {
  await execute(
    `DELETE s FROM user_theme_shares s JOIN user_themes t ON t.id = s.theme_id
      WHERE s.theme_id = ? AND s.user_id = ? AND t.user_id = ?`,
    [themeId, userId, ownerId],
  );
}

/** Someone removes a theme that was shared with them from their list. */
export async function leaveSharedTheme(userId: number, themeId: number) {
  await execute('DELETE FROM user_theme_shares WHERE theme_id = ? AND user_id = ?', [
    themeId,
    userId,
  ]);
}

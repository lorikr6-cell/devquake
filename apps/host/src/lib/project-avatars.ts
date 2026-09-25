import 'server-only';
import { execute, query, queryOne, type Row } from './db';
import type { SessionUser } from './auth/session';

/** A project's chosen logo colour and symbol (NULL = automatic, lib/project-avatar.ts). */
export interface AvatarChoice {
  color: string | null;
  symbol: string | null;
}

const NONE: AvatarChoice = { color: null, symbol: null };

/**
 * Chosen logo colours and symbols of all projects. Before migration 0014 is imported every
 * project simply gets the automatic logo.
 */
export async function avatarChoices(): Promise<Map<number, AvatarChoice>> {
  const rows = await query<
    Row & { id: number; avatar_color: string | null; avatar_symbol: string | null }
  >('SELECT id, avatar_color, avatar_symbol FROM projects').catch(() => []);
  return new Map(rows.map((r) => [r.id, { color: r.avatar_color, symbol: r.avatar_symbol }]));
}

export async function avatarChoice(projectId: number): Promise<AvatarChoice> {
  return (await avatarChoices()).get(projectId) ?? NONE;
}

/** Admins may change every project's logo; users only those of projects they manage. */
export async function canEditProjectAvatar(user: SessionUser, projectId: number) {
  if (user.isAdmin) return true;
  const row = await queryOne<Row & { n: number }>(
    `SELECT COUNT(*) AS n FROM user_projects
      WHERE user_id = ? AND project_id = ? AND project_role = 'manager'`,
    [user.userId, projectId],
  );
  return Number(row?.n ?? 0) > 0;
}

/** Ids of the projects the user manages (their logo can be changed from the account page). */
export async function managedProjectIds(userId: number): Promise<Set<number>> {
  const rows = await query<Row & { project_id: number }>(
    "SELECT project_id FROM user_projects WHERE user_id = ? AND project_role = 'manager'",
    [userId],
  );
  return new Set(rows.map((r) => r.project_id));
}

export async function saveAvatarChoice(projectId: number, choice: AvatarChoice) {
  await execute('UPDATE projects SET avatar_color = ?, avatar_symbol = ? WHERE id = ?', [
    choice.color,
    choice.symbol,
    projectId,
  ]);
}

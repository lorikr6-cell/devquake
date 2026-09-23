import 'server-only';
import { query, queryOne, type Row } from '../db';

export const IDEA_STATUSES = [
  'idea',
  'planned',
  'in_progress',
  'blocked',
  'done',
  'dropped',
] as const;
export const IDEA_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export const PROJECT_KINDS = ['platform', 'plugin', 'other'] as const;
export const PROJECT_STATUSES = ['active', 'paused', 'completed', 'archived'] as const;

export type IdeaStatus = (typeof IDEA_STATUSES)[number];
export type IdeaPriority = (typeof IDEA_PRIORITIES)[number];

export const STATUS_LABELS: Record<IdeaStatus, string> = {
  idea: 'Idea',
  planned: 'Planned',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
  dropped: 'Dropped',
};

export const PRIORITY_LABELS: Record<IdeaPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export interface IdeaRow extends Row {
  id: number;
  project_id: number | null;
  project_name: string | null;
  title: string;
  summary: string | null;
  status: IdeaStatus;
  priority: IdeaPriority;
  progress: number;
  target_date: Date | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectRow extends Row {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  kind: string;
  plugin_id: string | null;
  status: string;
  is_online: number;
  idea_count: number;
  open_count: string | number | null;
  avg_progress: string | number | null;
}

export interface IdeaUpdateRow extends Row {
  id: number;
  note: string | null;
  old_status: string | null;
  new_status: string | null;
  old_progress: number | null;
  new_progress: number | null;
  created_at: Date;
  author_name: string | null;
}

const IDEA_SELECT = `
  SELECT i.*, p.name AS project_name
    FROM ideas i LEFT JOIN projects p ON p.id = i.project_id`;

const PRIORITY_ORDER = `FIELD(i.priority, 'critical', 'high', 'medium', 'low')`;

export function listIdeas(filter: { status?: string; projectId?: number } = {}) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.status && (IDEA_STATUSES as readonly string[]).includes(filter.status)) {
    where.push('i.status = ?');
    params.push(filter.status);
  }
  if (filter.projectId) {
    where.push('i.project_id = ?');
    params.push(filter.projectId);
  }
  return query<IdeaRow>(
    `${IDEA_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY FIELD(i.status, 'in_progress', 'blocked', 'planned', 'idea', 'done', 'dropped'),
              ${PRIORITY_ORDER}, i.updated_at DESC`,
    params,
  );
}

export function getIdea(id: number) {
  return queryOne<IdeaRow>(`${IDEA_SELECT} WHERE i.id = ?`, [id]);
}

export function listIdeaUpdates(ideaId: number) {
  return query<IdeaUpdateRow>(
    `SELECT u.*, us.display_name AS author_name
       FROM idea_updates u LEFT JOIN users us ON us.id = u.author_id
      WHERE u.idea_id = ? ORDER BY u.created_at DESC, u.id DESC`,
    [ideaId],
  );
}

export function listProjects() {
  return query<ProjectRow>(
    `SELECT p.*, COUNT(i.id) AS idea_count,
            SUM(i.status NOT IN ('done', 'dropped')) AS open_count,
            AVG(CASE WHEN i.status <> 'dropped' THEN i.progress END) AS avg_progress
       FROM projects p LEFT JOIN ideas i ON i.project_id = p.id
      GROUP BY p.id
      ORDER BY FIELD(p.status, 'active', 'paused', 'completed', 'archived'), p.sort_order, p.name`,
  );
}

interface StatusCountRow extends Row {
  status: IdeaStatus;
  n: number;
}

export async function countIdeasByStatus(): Promise<Record<IdeaStatus, number>> {
  const rows = await query<StatusCountRow>(
    'SELECT status, COUNT(*) AS n FROM ideas GROUP BY status',
  );
  const counts = Object.fromEntries(IDEA_STATUSES.map((s) => [s, 0])) as Record<IdeaStatus, number>;
  for (const r of rows) counts[r.status] = Number(r.n);
  return counts;
}

export function listActiveIdeas(limit = 8) {
  return query<IdeaRow>(
    `${IDEA_SELECT} WHERE i.status IN ('in_progress', 'blocked')
     ORDER BY i.status = 'blocked' DESC, ${PRIORITY_ORDER}, i.updated_at DESC LIMIT ?`,
    [limit],
  );
}

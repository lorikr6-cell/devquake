'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logActivity } from '@/lib/activity';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { execute, getPool } from '@/lib/db';
import {
  IDEA_PRIORITIES,
  IDEA_STATUSES,
  getIdea,
  type IdeaPriority,
  type IdeaStatus,
} from '@/lib/admin/ideas';
import { getRequestInfo } from '@/lib/request';

interface IdeaInput {
  title: string;
  summary: string | null;
  projectId: number | null;
  status: IdeaStatus;
  priority: IdeaPriority;
  progress: number;
  targetDate: string | null;
  isPublic: boolean;
  note: string | null;
}

function text(form: FormData, name: string, max: number): string | null {
  const value = String(form.get(name) ?? '').trim();
  return value ? value.slice(0, max) : null;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly unknown[]).includes(value) ? (value as T) : fallback;
}

function parseIdea(form: FormData): IdeaInput {
  const title = text(form, 'title', 200);
  if (!title) throw new Error('Title is required');
  const projectId = Number(form.get('project_id'));
  const progress = Math.round(Number(form.get('progress')));
  const targetDate = text(form, 'target_date', 10);
  const status = oneOf(form.get('status'), IDEA_STATUSES, 'idea');
  return {
    title,
    summary: text(form, 'summary', 10_000),
    projectId: Number.isInteger(projectId) && projectId > 0 ? projectId : null,
    status,
    priority: oneOf(form.get('priority'), IDEA_PRIORITIES, 'medium'),
    progress:
      status === 'done'
        ? 100
        : Number.isFinite(progress)
          ? Math.max(0, Math.min(100, progress))
          : 0,
    targetDate: targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate) ? targetDate : null,
    isPublic: form.get('is_public') === 'on',
    note: text(form, 'note', 10_000),
  };
}

async function audit(action: string, userId: number, ideaId: number, metadata?: object) {
  const info = await getRequestInfo();
  await logActivity({
    source: 'admin-cp',
    action,
    actorUserId: userId,
    entityType: 'idea',
    entityId: ideaId,
    ip: info.ip,
    userAgent: info.userAgent,
    metadata: metadata as Record<string, unknown> | undefined,
  });
}

export async function createIdeaAction(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const idea = parseIdea(form);

  const result = await execute(
    `INSERT INTO ideas (project_id, title, summary, status, priority, progress, target_date,
                        is_public, started_at, completed_at, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?,
             IF(? IN ('in_progress', 'blocked', 'done'), UTC_TIMESTAMP(), NULL),
             IF(? = 'done', UTC_TIMESTAMP(), NULL), ?, ?)`,
    [
      idea.projectId,
      idea.title,
      idea.summary,
      idea.status,
      idea.priority,
      idea.progress,
      idea.targetDate,
      idea.isPublic ? 1 : 0,
      idea.status,
      idea.status,
      admin.userId,
      admin.userId,
    ],
  );
  const id = result.insertId;
  await execute(
    `INSERT INTO idea_updates (idea_id, author_id, note, new_status, new_progress)
     VALUES (?, ?, ?, ?, ?)`,
    [id, admin.userId, idea.note ?? 'Created', idea.status, idea.progress],
  );
  await audit('idea.created', admin.userId, id, { title: idea.title, public: idea.isPublic });

  revalidatePath(ADMIN_BASE, 'layout');
  redirect(`${ADMIN_BASE}/ideas/${id}`);
}

export async function updateIdeaAction(ideaId: number, form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const current = await getIdea(ideaId);
  if (!current) redirect(`${ADMIN_BASE}/ideas`);
  const idea = parseIdea(form);

  const statusChanged = current.status !== idea.status;
  const progressChanged = current.progress !== idea.progress;
  const visibilityChanged = (current.is_public === 1) !== idea.isPublic;

  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `UPDATE ideas SET project_id = ?, title = ?, summary = ?, status = ?, priority = ?,
              progress = ?, target_date = ?, is_public = ?, updated_by = ?,
              started_at = IF(started_at IS NULL AND ? IN ('in_progress', 'blocked', 'done'),
                              UTC_TIMESTAMP(), started_at),
              completed_at = IF(? = 'done', COALESCE(completed_at, UTC_TIMESTAMP()), NULL)
        WHERE id = ?`,
      [
        idea.projectId,
        idea.title,
        idea.summary,
        idea.status,
        idea.priority,
        idea.progress,
        idea.targetDate,
        idea.isPublic ? 1 : 0,
        admin.userId,
        idea.status,
        idea.status,
        ideaId,
      ],
    );
    if (statusChanged || progressChanged || idea.note) {
      await conn.query(
        `INSERT INTO idea_updates
           (idea_id, author_id, note, old_status, new_status, old_progress, new_progress)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          ideaId,
          admin.userId,
          idea.note,
          statusChanged ? current.status : null,
          statusChanged ? idea.status : null,
          progressChanged ? current.progress : null,
          progressChanged ? idea.progress : null,
        ],
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  await audit('idea.updated', admin.userId, ideaId, {
    ...(statusChanged && { status: [current.status, idea.status] }),
    ...(progressChanged && { progress: [current.progress, idea.progress] }),
    ...(visibilityChanged && { visibility: idea.isPublic ? 'public' : 'private' }),
  });

  revalidatePath(ADMIN_BASE, 'layout');
  redirect(`${ADMIN_BASE}/ideas/${ideaId}`);
}

export async function deleteIdeaAction(ideaId: number, form: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (form.get('confirm') !== 'yes') redirect(`${ADMIN_BASE}/ideas/${ideaId}`);
  const current = await getIdea(ideaId);
  if (current) {
    await execute('DELETE FROM ideas WHERE id = ?', [ideaId]);
    await audit('idea.deleted', admin.userId, ideaId, { title: current.title });
  }
  revalidatePath(ADMIN_BASE, 'layout');
  redirect(`${ADMIN_BASE}/ideas`);
}

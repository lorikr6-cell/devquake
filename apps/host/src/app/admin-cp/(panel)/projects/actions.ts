'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logActivity } from '@/lib/activity';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { execute } from '@/lib/db';
import { PROJECT_KINDS, PROJECT_STATUSES } from '@/lib/admin/ideas';
import { getRequestInfo } from '@/lib/request';

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

async function audit(action: string, userId: number, projectId: number, metadata: object) {
  const info = await getRequestInfo();
  await logActivity({
    source: 'admin-cp',
    action,
    actorUserId: userId,
    entityType: 'project',
    entityId: projectId,
    ip: info.ip,
    userAgent: info.userAgent,
    metadata: metadata as Record<string, unknown>,
  });
}

export async function createProjectAction(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const name = String(form.get('name') ?? '')
    .trim()
    .slice(0, 120);
  const slug = String(form.get('slug') ?? '')
    .trim()
    .toLowerCase();
  const kindValue = String(form.get('kind'));
  const kind = (PROJECT_KINDS as readonly string[]).includes(kindValue) ? kindValue : 'other';
  const description = String(form.get('description') ?? '').trim() || null;
  if (!name || !SLUG.test(slug)) redirect(`${ADMIN_BASE}/projects?error=invalid`);

  let id: number;
  try {
    const result = await execute(
      `INSERT INTO projects (slug, name, kind, plugin_id, description, created_by, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(p.sort_order), 0) + 10 FROM projects p))`,
      [slug, name, kind, kind === 'plugin' ? slug : null, description, admin.userId],
    );
    id = result.insertId;
  } catch (err) {
    if ((err as { code?: string }).code === 'ER_DUP_ENTRY') {
      redirect(`${ADMIN_BASE}/projects?error=duplicate`);
    }
    throw err;
  }
  await audit('project.created', admin.userId, id, { slug, name });
  revalidatePath(ADMIN_BASE, 'layout');
  redirect(`${ADMIN_BASE}/projects`);
}

export async function setProjectStatusAction(projectId: number, form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const status = String(form.get('status'));
  if ((PROJECT_STATUSES as readonly string[]).includes(status)) {
    await execute('UPDATE projects SET status = ? WHERE id = ?', [status, projectId]);
    await audit('project.status_changed', admin.userId, projectId, { status });
  }
  revalidatePath(ADMIN_BASE, 'layout');
  redirect(`${ADMIN_BASE}/projects`);
}

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logActivity } from '@/lib/activity';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { execute } from '@/lib/db';
import { PROJECT_KINDS, PROJECT_STATUSES } from '@/lib/admin/ideas';
import { getRequestInfo } from '@/lib/request';
import { pluginSubdomains } from '@/plugins/registry.manifest.generated';

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
      // INSERT ... SELECT: MySQL rejects a VALUES subquery on the table being inserted into.
      `INSERT INTO projects (slug, name, kind, plugin_id, description, created_by, sort_order)
       SELECT ?, ?, ?, ?, ?, ?, COALESCE(MAX(sort_order), 0) + 10 FROM projects`,
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

/**
 * Saves the project page. "Online" makes the app on <plugin_id>.devquake.com reachable and
 * clickable on the landing page; it requires a subdomain whose app is deployed.
 */
export async function updateProjectAction(projectId: number, form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const back = `${ADMIN_BASE}/projects/${projectId}`;
  const name = String(form.get('name') ?? '')
    .trim()
    .slice(0, 120);
  const description =
    String(form.get('description') ?? '')
      .trim()
      .slice(0, 2000) || null;
  const pluginId =
    String(form.get('plugin_id') ?? '')
      .trim()
      .toLowerCase() || null;
  const statusValue = String(form.get('status'));
  const status = (PROJECT_STATUSES as readonly string[]).includes(statusValue)
    ? statusValue
    : 'active';
  const online = form.get('is_online') === 'on';

  if (!name || (pluginId && !SLUG.test(pluginId))) redirect(`${back}?error=invalid`);
  if (online && (!pluginId || !(pluginSubdomains as readonly string[]).includes(pluginId))) {
    redirect(`${back}?error=not_deployed`);
  }
  if (online && status === 'archived') redirect(`${back}?error=archived`);

  await execute(
    `UPDATE projects SET name = ?, description = ?, plugin_id = ?, status = ?, is_online = ?
      WHERE id = ?`,
    [name, description, pluginId, status, online ? 1 : 0, projectId],
  );
  await audit('project.updated', admin.userId, projectId, { status, online, pluginId });
  revalidatePath('/', 'layout');
  redirect(`${back}?saved=1`);
}

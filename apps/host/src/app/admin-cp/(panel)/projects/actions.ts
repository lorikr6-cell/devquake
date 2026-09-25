'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logActivity } from '@/lib/activity';
import { ADMIN_BASE, requireAdmin, requireOwner } from '@/lib/auth/admin';
import { parseNpsCost } from '@/lib/nps-rules';
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
  const isPublic = form.get('is_public') === 'on';
  if (!name || !SLUG.test(slug)) redirect(`${ADMIN_BASE}/projects/new?error=invalid`);

  let id: number;
  try {
    const result = await execute(
      // INSERT ... SELECT: MySQL rejects a VALUES subquery on the table being inserted into.
      `INSERT INTO projects (slug, name, kind, plugin_id, description, is_public, created_by, sort_order)
       SELECT ?, ?, ?, ?, ?, ?, ?, COALESCE(MAX(sort_order), 0) + 10 FROM projects`,
      [
        slug,
        name,
        kind,
        kind === 'plugin' ? slug : null,
        description,
        isPublic ? 1 : 0,
        admin.userId,
      ],
    );
    id = result.insertId;
  } catch (err) {
    if ((err as { code?: string }).code === 'ER_DUP_ENTRY') {
      redirect(`${ADMIN_BASE}/projects/new?error=duplicate`);
    }
    throw err;
  }
  await audit('project.created', admin.userId, id, { slug, name, public: isPublic });
  revalidatePath(ADMIN_BASE, 'layout');
  // Continue on its page: subdomain, online, NPS cost and logo are set there.
  redirect(`${ADMIN_BASE}/projects/${id}?saved=1`);
}

/**
 * Saves the project page. "Public" lists the project on the landing page; private projects
 * exist only in /admin-cp. "Online" makes the app on <plugin_id>.devquake.com reachable and
 * clickable; it requires a public project and a subdomain whose app is deployed.
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
  const isPublic = form.get('is_public') === 'on';

  if (!name || (pluginId && !SLUG.test(pluginId))) redirect(`${back}?error=invalid`);
  if (online && (!pluginId || !(pluginSubdomains as readonly string[]).includes(pluginId))) {
    redirect(`${back}?error=not_deployed`);
  }
  if (online && status === 'archived') redirect(`${back}?error=archived`);
  // Private means "only in /admin-cp": its app must not be reachable either.
  if (online && !isPublic) redirect(`${back}?error=private_online`);

  await execute(
    `UPDATE projects SET name = ?, description = ?, plugin_id = ?, status = ?, is_online = ?,
            is_public = ?
      WHERE id = ?`,
    [name, description, pluginId, status, online ? 1 : 0, isPublic ? 1 : 0, projectId],
  );
  await audit('project.updated', admin.userId, projectId, {
    status,
    online,
    public: isPublic,
    pluginId,
  });
  revalidatePath('/', 'layout');
  redirect(`${back}?saved=1`);
}

/**
 * Sets how many NPS points subscribing to the project costs (ADR 0012). Owner only: it decides
 * what members pay. Existing subscriptions are not affected.
 */
export async function setProjectNpsCostAction(projectId: number, form: FormData): Promise<void> {
  const owner = await requireOwner();
  const back = `${ADMIN_BASE}/projects/${projectId}`;
  const cost = parseNpsCost(form.get('nps_cost'));
  if (cost === null) redirect(`${back}?error=nps_cost`);
  await execute('UPDATE projects SET nps_cost = ? WHERE id = ?', [cost, projectId]);
  await audit('project.nps_cost', owner.userId, projectId, { npsCost: cost });
  revalidatePath('/', 'layout');
  redirect(`${back}?saved=1`);
}

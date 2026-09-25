'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logActivity } from '@/lib/activity';
import { ADMIN_BASE, requireOwner } from '@/lib/auth/admin';
import { ROLE_ADMIN, ROLE_OWNER, revokeAllSessions } from '@/lib/auth/session';
import { getPool } from '@/lib/db';
import { hostUrl, pluginUrl } from '@/lib/domain';
import { listProjects } from '@/lib/admin/ideas';
import {
  PROJECT_ROLES,
  getUser,
  getUserProjects,
  getUserRoleCodes,
  getUserSubscriptionIds,
  listRoles,
  type ProjectRole,
} from '@/lib/admin/users';
import { sendMail } from '@/lib/mail/mailer';
import {
  accountChangedEmail,
  describeAccountChange,
  type AccountChange,
} from '@/lib/mail/templates';
import { userLocale } from '@/lib/user-locale';
import { getRequestInfo } from '@/lib/request';

/**
 * Applies everything the owner changed on the user page in one transaction, then emails the
 * user a branded summary with instructions. Nothing is saved until "Submit changes".
 * The rating is internal: it is saved and logged but never mentioned to the user.
 */
export async function saveUserAction(userId: number, form: FormData): Promise<void> {
  const owner = await requireOwner();
  const back = `${ADMIN_BASE}/users/${userId}`;

  const [user, currentRoles, currentProjects, roles, projects, currentSubs] = await Promise.all([
    getUser(userId),
    getUserRoleCodes(userId),
    getUserProjects(userId),
    listRoles(),
    listProjects(),
    getUserSubscriptionIds(userId),
  ]);
  if (!user) redirect(`${ADMIN_BASE}/users`);

  const targetIsOwner = currentRoles.includes(ROLE_OWNER);
  const isSelf = userId === owner.userId;
  const roleByCode = new Map(roles.map((r) => [r.code, r]));
  const projectById = new Map(projects.map((p) => [p.id, p]));

  // ---- desired state from the form -------------------------------------------------------
  // Owner role is never assignable here; the admin checkbox maps to platform.admin.
  const desiredRoles = new Set(
    form
      .getAll('role')
      .map(String)
      .filter((c) => roleByCode.has(c) && c !== ROLE_OWNER && c !== ROLE_ADMIN),
  );
  if (form.get('admin') === 'on') desiredRoles.add(ROLE_ADMIN);
  if (targetIsOwner) {
    desiredRoles.add(ROLE_OWNER);
    if (currentRoles.includes(ROLE_ADMIN)) desiredRoles.add(ROLE_ADMIN);
  }

  const desiredProjects = new Map<number, ProjectRole>();
  for (const raw of form.getAll('project')) {
    const id = Number(raw);
    if (!projectById.has(id)) continue;
    const role = String(form.get(`project_role_${id}`));
    desiredProjects.set(
      id,
      (PROJECT_ROLES as readonly string[]).includes(role) ? (role as ProjectRole) : 'member',
    );
  }

  // Subscriptions: any public, non-archived project; existing ones may always be removed.
  const subscribable = (id: number) => {
    const p = projectById.get(id);
    return !!p && p.is_public === 1 && p.status !== 'archived';
  };
  const desiredSubs = new Set(
    form
      .getAll('subscription')
      .map(Number)
      .filter((id) => subscribable(id) || currentSubs.includes(id)),
  );

  let status = user.status;
  const statusInput = String(form.get('status') ?? user.status);
  if (!targetIsOwner && !isSelf && ['active', 'disabled'].includes(statusInput)) {
    status = statusInput as typeof status;
  }

  const ratingInput = String(form.get('rating') ?? '');
  const rating = /^[1-5]$/.test(ratingInput) ? Number(ratingInput) : null;
  const unlock = form.get('unlock') === 'on' && user.locked === 1;

  // ---- diff ------------------------------------------------------------------------------
  const addedRoles = [...desiredRoles].filter((c) => !currentRoles.includes(c));
  const removedRoles = currentRoles.filter((c) => !desiredRoles.has(c) && c !== ROLE_OWNER);
  const currentProjectMap = new Map(currentProjects.map((p) => [p.project_id, p.project_role]));
  const addedProjects = [...desiredProjects].filter(([id]) => !currentProjectMap.has(id));
  const removedProjects = [...currentProjectMap.keys()].filter((id) => !desiredProjects.has(id));
  const changedProjects = [...desiredProjects].filter(
    ([id, role]) => currentProjectMap.has(id) && currentProjectMap.get(id) !== role,
  );
  const addedSubs = [...desiredSubs].filter((id) => !currentSubs.includes(id));
  const removedSubs = currentSubs.filter((id) => !desiredSubs.has(id));
  const statusChanged = status !== user.status;
  const ratingChanged = rating !== user.rating;

  const userVisible =
    addedRoles.length +
      removedRoles.length +
      addedProjects.length +
      removedProjects.length +
      changedProjects.length +
      addedSubs.length +
      removedSubs.length >
      0 ||
    statusChanged ||
    unlock;
  if (!userVisible && !ratingChanged) redirect(`${back}?saved=none`);

  // ---- apply -----------------------------------------------------------------------------
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    for (const code of addedRoles) {
      await conn.query(
        'INSERT IGNORE INTO user_roles (user_id, role_id, granted_by) VALUES (?, ?, ?)',
        [userId, roleByCode.get(code)!.id, owner.userId],
      );
    }
    for (const code of removedRoles) {
      await conn.query('DELETE FROM user_roles WHERE user_id = ? AND role_id = ?', [
        userId,
        roleByCode.get(code)!.id,
      ]);
    }
    for (const [projectId, role] of [...addedProjects, ...changedProjects]) {
      await conn.query(
        `INSERT INTO user_projects (user_id, project_id, project_role, assigned_by)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE project_role = VALUES(project_role), assigned_by = VALUES(assigned_by),
                                 assigned_at = UTC_TIMESTAMP()`,
        [userId, projectId, role, owner.userId],
      );
    }
    for (const projectId of removedProjects) {
      await conn.query('DELETE FROM user_projects WHERE user_id = ? AND project_id = ?', [
        userId,
        projectId,
      ]);
    }
    for (const projectId of addedSubs) {
      await conn.query(
        'INSERT IGNORE INTO project_subscriptions (user_id, project_id) VALUES (?, ?)',
        [userId, projectId],
      );
    }
    for (const projectId of removedSubs) {
      await conn.query('DELETE FROM project_subscriptions WHERE user_id = ? AND project_id = ?', [
        userId,
        projectId,
      ]);
    }
    await conn.query(
      `UPDATE users SET status = ?, rating = ?,
              locked_until = IF(?, NULL, locked_until),
              failed_login_count = IF(?, 0, failed_login_count)
        WHERE id = ?`,
      [status, rating, unlock, unlock, userId],
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  if (statusChanged && status === 'disabled') await revokeAllSessions(userId);

  // ---- the changes, worded per language: the email in the member's, the log in English ------
  const role = (code: string) => ({
    role: roleByCode.get(code)?.name ?? code,
    adminRole: code === ROLE_ADMIN,
  });
  const projectName = (id: number) => projectById.get(id)?.name ?? `Project #${id}`;
  const changes: AccountChange[] = [
    ...addedRoles.map((c) => ({ kind: 'roleGranted' as const, ...role(c) })),
    ...removedRoles.map((c) => ({ kind: 'roleRemoved' as const, ...role(c) })),
    ...addedProjects.map(([id, r]) => ({
      kind: 'projectAdded' as const,
      project: projectName(id),
      projectRole: r,
    })),
    ...changedProjects.map(([id, r]) => ({
      kind: 'projectRole' as const,
      project: projectName(id),
      projectRole: r,
    })),
    ...removedProjects.map((id) => ({ kind: 'projectRemoved' as const, project: projectName(id) })),
    ...addedSubs.map((id) => ({ kind: 'subscribed' as const, project: projectName(id) })),
    ...removedSubs.map((id) => ({ kind: 'unsubscribed' as const, project: projectName(id) })),
  ];
  if (statusChanged) changes.push({ kind: status === 'disabled' ? 'disabled' : 'activated' });
  if (unlock) changes.push({ kind: 'unlocked' });

  let mail: 'sent' | 'failed' | 'none' = 'none';
  if (userVisible) {
    const projectEntry = (id: number, role: string) => {
      const p = projectById.get(id);
      return {
        name: projectName(id),
        role,
        // Only link apps that are live; the email must not point at a closed app.
        url: p?.plugin_id && p.is_online === 1 && p.is_public === 1 ? pluginUrl(p.plugin_id) : null,
      };
    };
    const finalProjects = [
      ...[...desiredProjects].map(([id, role]) => projectEntry(id, role)),
      ...[...desiredSubs]
        .filter((id) => !desiredProjects.has(id))
        .map((id) => projectEntry(id, 'subscribed')),
    ];
    const ok = await sendMail({
      to: user.email,
      userId,
      template: 'account.changed',
      email: accountChangedEmail({
        siteUrl: hostUrl(),
        name: user.display_name,
        changes,
        isAdmin: desiredRoles.has(ROLE_ADMIN) || desiredRoles.has(ROLE_OWNER),
        adminUrl: `${hostUrl()}${ADMIN_BASE}`,
        projects: finalProjects,
        disabled: status === 'disabled',
        locale: await userLocale(userId),
      }),
    });
    mail = ok ? 'sent' : 'failed';
  }

  const info = await getRequestInfo();
  await logActivity({
    source: 'admin-cp',
    level:
      addedRoles.includes(ROLE_ADMIN) || removedRoles.includes(ROLE_ADMIN) ? 'security' : 'info',
    action: 'user.updated',
    // The message is shown to the user on their account page: user-visible changes only. The
    // rating is internal and goes into metadata (owner's activity log only).
    message: changes
      .map((c) => describeAccountChange(c))
      .join('; ')
      .slice(0, 500),
    actorUserId: owner.userId,
    entityType: 'user',
    entityId: userId,
    ip: info.ip,
    userAgent: info.userAgent,
    metadata: {
      email: mail,
      ...(ratingChanged && { rating: [user.rating, rating] }),
    },
  });

  revalidatePath(`${ADMIN_BASE}/users`, 'layout');
  redirect(`${back}?saved=1&mail=${mail}`);
}

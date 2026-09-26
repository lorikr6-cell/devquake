import 'server-only';
import type { PluginMailer } from '@devquake/plugin-sdk';
import { isLocale } from '@devquake/ui';
import { ROLE_ADMIN, ROLE_OWNER } from './auth/session';
import { query, queryOne, type Row } from './db';
import { hostUrl } from './domain';
import { sendMail } from './mail/mailer';
import { pluginEmail } from './mail/templates';
import { getMemberships, projectForPlugin } from './subscriptions';

/**
 * Email for apps (ADR 0014): an app names a user id and writes the content in the person's
 * language; the address, the access check and the layout stay in the host.
 */
export function pluginMailer(
  pluginId: string,
  /** manifest.mailWithoutAccess (ADR 0022): may write to members without access to the app. */
  allowWithoutAccess = false,
): PluginMailer {
  return {
    async sendToUser(userId, compose, options) {
      const user = await queryOne<Row & { email: string; status: string; locale: string | null }>(
        'SELECT email, status, locale FROM users WHERE id = ?',
        [userId],
      );
      if (!user || user.status !== 'active') return false;
      const skipAccess = allowWithoutAccess && options?.withoutAccess === true;
      if (!skipAccess && !(await mayUseApp(pluginId, userId))) return false;
      const locale = isLocale(user.locale) ? user.locale : 'en';
      const content = await compose(locale);
      return sendMail({
        to: user.email,
        email: pluginEmail({ siteUrl: hostUrl(), locale, content }),
        template: `app:${pluginId}`.slice(0, 40),
        userId,
      });
    },
  };
}

/** Subscribed to or assigned to the app's project, or an admin (as in appAccess). */
async function mayUseApp(pluginId: string, userId: number): Promise<boolean> {
  const roles = await query<Row & { code: string }>(
    'SELECT r.code FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?',
    [userId],
  );
  if (roles.some((r) => r.code === ROLE_OWNER || r.code === ROLE_ADMIN)) return true;
  const project = await projectForPlugin(pluginId);
  return project ? (await getMemberships(userId)).has(project.id) : false;
}

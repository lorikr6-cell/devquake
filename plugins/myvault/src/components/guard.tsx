import type { PluginContext, PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import { rich } from '@devquake/ui';
import type { ReactNode } from 'react';
import { localeOf, translator } from '../i18n';
import { recordActivity } from '../lib/data';
import { masterKey } from '../lib/server-crypto';
import { Notice } from './ui';

export type PageScope =
  { ok: true; db: PluginDatabase; user: PluginUser } | { ok: false; notice: ReactNode };

/**
 * Pages need a signed-in user, the app's database and the master key (MYVAULT_MASTER_KEY);
 * otherwise they show why not. Each visit also counts as the owner being active.
 */
export async function pageScope(ctx: PluginContext): Promise<PageScope> {
  const t = translator(localeOf(ctx), 'guard');
  if (!ctx.user) {
    return {
      ok: false,
      notice: (
        <Notice title={t('signInTitle')}>
          <p>
            {rich(t('signInBody'), {
              link: (
                <a className="font-medium text-quake underline" href={`${ctx.hostUrl}/#account`}>
                  {t('signInLink')}
                </a>
              ),
            })}
          </p>
        </Notice>
      ),
    };
  }
  if (!ctx.db || !masterKey()) {
    return {
      ok: false,
      notice: (
        <Notice title={t('unavailableTitle')}>
          <p>{t('unavailableBody')}</p>
        </Notice>
      ),
    };
  }
  await recordActivity(ctx.db, ctx.user.id).catch(() => undefined);
  return { ok: true, db: ctx.db, user: ctx.user };
}

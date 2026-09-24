import type { PluginContext, PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import type { ReactNode } from 'react';
import { Notice } from './ui';

export type PageScope =
  { ok: true; db: PluginDatabase; user: PluginUser } | { ok: false; notice: ReactNode };

/** Pages need a signed-in user and the app's database; otherwise they show why not. */
export function pageScope(ctx: PluginContext): PageScope {
  if (!ctx.user) {
    return {
      ok: false,
      notice: (
        <Notice title="Sign in to use shopping lists">
          <p>
            Shopping lists use your DevQuake account.{' '}
            <a className="font-medium text-quake underline" href={`${ctx.hostUrl}/#account`}>
              Sign in on DevQuake
            </a>{' '}
            and come back here.
          </p>
        </Notice>
      ),
    };
  }
  if (!ctx.db) {
    return {
      ok: false,
      notice: (
        <Notice title="Not available right now">
          <p>Shopping lists are being set up. Please try again later.</p>
        </Notice>
      ),
    };
  }
  return { ok: true, db: ctx.db, user: ctx.user };
}

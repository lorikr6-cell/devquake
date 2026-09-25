import 'server-only';
import { cache } from 'react';
import { queryOne, type Row } from './db';
import { hostUrl } from './domain';
import {
  projectAvatarLook,
  type ProjectAvatarInput,
  type ProjectAvatarLook,
} from './project-avatar';

/**
 * The logo of an app's project (ADR 0016): the same generated logo as on the project cards, for
 * the app's favicon and its toolbar. Apps without a project row (local development without a
 * database) get the automatic logo of their manifest name.
 */
export interface AppIdentity {
  name: string;
  look: ProjectAvatarLook;
  /** Absolute URL of the SVG, versioned by its look so browsers pick up a new logo. */
  iconUrl: string;
}

export const appIdentity = cache(
  async (pluginId: string, fallbackName: string): Promise<AppIdentity> => {
    const row = process.env.MAIN_DB_NAME
      ? await queryOne<
          Row & {
            name: string;
            slug: string;
            description: string | null;
            avatar_color: string | null;
            avatar_symbol: string | null;
          }
        >(
          `SELECT name, slug, description, avatar_color, avatar_symbol FROM projects
            WHERE plugin_id = ? AND status <> 'archived'
            ORDER BY is_online DESC, is_public DESC LIMIT 1`,
          [pluginId],
        ).catch(() => null)
      : null;
    const input: ProjectAvatarInput = row
      ? {
          name: row.name,
          slug: row.slug,
          pluginId,
          description: row.description,
          color: row.avatar_color,
          symbol: row.avatar_symbol,
        }
      : { name: fallbackName, slug: pluginId, pluginId };
    const look = projectAvatarLook(input);
    const version = encodeURIComponent(`${look.background}${look.symbol}${look.initials}`);
    return {
      name: input.name,
      look,
      iconUrl: `${hostUrl()}/api/app-icon/${encodeURIComponent(pluginId)}?v=${version}`,
    };
  },
);

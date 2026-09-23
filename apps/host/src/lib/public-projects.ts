import 'server-only';
import { query, type Row } from './db';
import { pluginUrl } from './domain';
import type { IdeaStatus } from './admin/ideas';
import { pluginSubdomains } from '@/plugins/registry.manifest.generated';

export interface PublicIdea {
  id: number;
  title: string;
  status: IdeaStatus;
  progress: number;
}

export interface PublicProject {
  id: number;
  name: string;
  description: string | null;
  status: 'active' | 'paused' | 'completed';
  kind: string;
  progress: number;
  ideasDone: number;
  ideasTotal: number;
  ideas: PublicIdea[];
  /** Set only when an admin put the project online AND its app is deployed. */
  url: string | null;
}

interface ProjectRow extends Row {
  id: number;
  name: string;
  description: string | null;
  status: PublicProject['status'];
  kind: string;
  plugin_id: string | null;
  is_online: number;
}

interface IdeaRow extends Row {
  id: number;
  project_id: number;
  title: string;
  status: IdeaStatus;
  progress: number;
}

/**
 * Projects for the landing page: everything not archived, with their ideas (dropped ideas
 * hidden). Idea summaries are internal notes and are never exposed here.
 */
export async function listPublicProjects(): Promise<PublicProject[]> {
  const [projects, ideas] = await Promise.all([
    query<ProjectRow>(
      `SELECT id, name, description, status, kind, plugin_id, is_online FROM projects
        WHERE status <> 'archived'
        ORDER BY is_online DESC, FIELD(status, 'active', 'paused', 'completed'), sort_order, name`,
    ),
    query<IdeaRow>(
      `SELECT id, project_id, title, status, progress FROM ideas
        WHERE status <> 'dropped' AND project_id IS NOT NULL
        ORDER BY FIELD(status, 'in_progress', 'blocked', 'planned', 'idea', 'done'), progress DESC, title`,
    ),
  ]);

  const deployed = new Set<string>(pluginSubdomains);
  return projects.map((p) => {
    const own = ideas.filter((i) => i.project_id === p.id);
    const progress = own.length
      ? Math.round(own.reduce((s, i) => s + Number(i.progress), 0) / own.length)
      : 0;
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      kind: p.kind,
      progress,
      ideasDone: own.filter((i) => i.status === 'done').length,
      ideasTotal: own.length,
      ideas: own.map((i) => ({
        id: i.id,
        title: i.title,
        status: i.status,
        progress: Number(i.progress),
      })),
      url:
        p.is_online === 1 && p.plugin_id && deployed.has(p.plugin_id)
          ? pluginUrl(p.plugin_id)
          : null,
    };
  });
}

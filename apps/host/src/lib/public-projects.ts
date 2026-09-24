import 'server-only';
import { query, type Row } from './db';
import { pluginUrl } from './domain';
import type { IdeaStatus } from './admin/ideas';
import { pluginSubdomains } from '@/plugins/registry.manifest.generated';
import type { PluginChangelogEntry } from '@devquake/plugin-sdk';
import { pluginChangelog } from './plugin-changelog';
import { loadPlugin } from './plugins';
import { feedbackSummaries } from './project-feedback';
import {
  EMPTY_FEEDBACK,
  sortByLiveAndLikes,
  type ProjectFeedbackSummary,
} from './project-feedback-rules';

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
  /** Likes and average ratings (migration 0012). */
  feedback: ProjectFeedbackSummary;
  /** Release notes of the project's app (its CHANGELOG.md), newest first; empty without an app. */
  changelog: PluginChangelogEntry[];
  /** Pages of the live app that anyone may open, e.g. its user manual (ADR 0009). */
  publicPages: Array<{ url: string; title: string }>;
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
 * Projects for the landing page: public and not archived, with their public ideas (dropped
 * ideas hidden). Private projects/ideas exist only in /admin-cp. Idea summaries are internal
 * notes and are never exposed here. Order: live projects first, then the most liked.
 */
export async function listPublicProjects(): Promise<PublicProject[]> {
  const [projects, ideas, feedback] = await Promise.all([
    query<ProjectRow>(
      `SELECT id, name, description, status, kind, plugin_id, is_online FROM projects
        WHERE status <> 'archived' AND is_public = 1
        ORDER BY is_online DESC, FIELD(status, 'active', 'paused', 'completed'), sort_order, name`,
    ),
    query<IdeaRow>(
      `SELECT id, project_id, title, status, progress FROM ideas
        WHERE status <> 'dropped' AND project_id IS NOT NULL AND is_public = 1
        ORDER BY FIELD(status, 'in_progress', 'blocked', 'planned', 'idea', 'done'), progress DESC, title`,
    ),
    // Before migration 0012 is applied the landing page still works, without likes.
    feedbackSummaries().catch(() => new Map<number, ProjectFeedbackSummary>()),
  ]);

  const deployed = new Set<string>(pluginSubdomains);
  const list = projects.map((p): PublicProject => {
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
      feedback: feedback.get(p.id) ?? EMPTY_FEEDBACK,
      changelog: p.plugin_id && deployed.has(p.plugin_id) ? pluginChangelog(p.plugin_id) : [],
      publicPages: [],
    };
  });
  // Live apps: link their public pages (a manual) from the card.
  await Promise.all(
    projects.map(async (p, i) => {
      const project = list[i]!;
      if (!project.url || !p.plugin_id) return;
      const plugin = await loadPlugin(p.plugin_id).catch(() => null);
      project.publicPages = (plugin?.manifest.publicPages ?? []).map((page) => ({
        url: `${project.url}${page.path}`,
        title: page.title,
      }));
    }),
  );
  return sortByLiveAndLikes(list);
}

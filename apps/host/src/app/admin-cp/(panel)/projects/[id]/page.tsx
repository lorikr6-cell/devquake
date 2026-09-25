import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@devquake/ui';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { queryOne, type Row } from '@/lib/db';
import { pluginUrl } from '@/lib/domain';
import { PROJECT_STATUSES } from '@/lib/admin/ideas';
import { pluginSubdomains } from '@/plugins/registry.manifest.generated';
import { PageHeader, Panel, inputClass, labelClass, linkClass } from '../../../_components/ui';
import { updateProjectAction } from '../actions';
import { ProjectAvatarEditor } from '@/components/project-avatar-editor';
import { avatarChoice } from '@/lib/project-avatars';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

interface ProjectRow extends Row {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  kind: string;
  plugin_id: string | null;
  status: string;
  is_online: number;
  is_public: number;
}

const ERRORS: Record<string, string> = {
  invalid: 'Name is required, and the subdomain may only contain a-z, 0-9 and dashes.',
  not_deployed:
    'This project cannot go online yet: set its subdomain to a plugin that is deployed (see the list below).',
  archived: 'An archived project cannot be online.',
  private_online: 'A private project cannot be online. Make it public first, or switch Online off.',
};

export async function generateMetadata({ params }: Props) {
  return { title: `Project #${(await params).id}` };
}

export default async function ProjectPage({ params, searchParams }: Props) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const { saved, error } = await searchParams;
  const project = await queryOne<ProjectRow>(
    'SELECT id, slug, name, description, kind, plugin_id, status, is_online, is_public FROM projects WHERE id = ?',
    [id],
  );
  if (!project) notFound();
  const logo = await avatarChoice(project.id);

  const deployed =
    !!project.plugin_id && (pluginSubdomains as readonly string[]).includes(project.plugin_id);
  const live = project.is_online === 1 && project.is_public === 1 && deployed;

  return (
    <>
      <PageHeader
        title={project.name}
        actions={
          <Link href={`${ADMIN_BASE}/projects`} className={linkClass}>
            ← All projects
          </Link>
        }
      />
      {saved && (
        <p
          role="status"
          className="mb-6 rounded-md border border-ink/10 bg-white px-4 py-3 text-sm dark:border-paper/10 dark:bg-paper/5"
        >
          Saved. The landing page shows the change right away.
        </p>
      )}
      {error && ERRORS[error] && (
        <p
          role="alert"
          className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
        >
          {ERRORS[error]}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel>
          <form action={updateProjectAction.bind(null, project.id)} className="space-y-4">
            <div>
              <label htmlFor="name" className={labelClass}>
                Name
              </label>
              <input
                id="name"
                name="name"
                required
                maxLength={120}
                defaultValue={project.name}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="description" className={labelClass}>
                Scope{' '}
                <span className="font-normal text-ink/60 dark:text-paper/60">
                  (public, shown on the landing page)
                </span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                maxLength={2000}
                defaultValue={project.description ?? ''}
                className={inputClass}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="plugin_id" className={labelClass}>
                  Subdomain / plugin id
                </label>
                <input
                  id="plugin_id"
                  name="plugin_id"
                  pattern="[a-z0-9][a-z0-9\-]{0,62}"
                  defaultValue={project.plugin_id ?? ''}
                  placeholder="e.g. bills"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="status" className={labelClass}>
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={project.status}
                  className={inputClass}
                >
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-md border border-ink/10 p-3 dark:border-paper/10">
              <input
                type="checkbox"
                name="is_public"
                defaultChecked={project.is_public === 1}
                className="mt-0.5 size-4 accent-[var(--dq-quake)]"
              />
              <span>
                <span className="font-medium">Public</span>
                <span className="block text-xs text-ink/60 dark:text-paper/60">
                  Show this project, its scope and its public ideas on the landing page, in the
                  public statistics and the sitemap. Private projects are only visible in this
                  control panel.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-md border border-ink/10 p-3 dark:border-paper/10">
              <input
                type="checkbox"
                name="is_online"
                defaultChecked={project.is_online === 1}
                className="mt-0.5 size-4 accent-[var(--dq-quake)]"
              />
              <span>
                <span className="font-medium">Online</span>
                <span className="block text-xs text-ink/60 dark:text-paper/60">
                  The app at its subdomain opens for subscribers (and users you assigned, and
                  admins). Offline apps are listed and can be subscribed to, but cannot be opened,
                  even by URL.
                </span>
              </span>
            </label>

            <Button type="submit">Save project</Button>
          </form>
        </Panel>

        <Panel>
          <h2 className="mb-3 font-semibold">Availability</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-ink/60 dark:text-paper/60">Visibility</dt>
            <dd>
              {project.is_public === 1 ? 'Public (on the landing page)' : 'Private (admin only)'}
            </dd>
            <dt className="text-ink/60 dark:text-paper/60">Subdomain</dt>
            <dd className="font-mono text-xs">
              {project.plugin_id ? pluginUrl(project.plugin_id) : '—'}
            </dd>
            <dt className="text-ink/60 dark:text-paper/60">App deployed</dt>
            <dd>{project.plugin_id ? (deployed ? 'Yes' : 'No, no plugin with this id') : '—'}</dd>
            <dt className="text-ink/60 dark:text-paper/60">Reachable now</dt>
            <dd>
              {live ? (
                <a
                  href={pluginUrl(project.plugin_id!)}
                  target="_blank"
                  rel="noopener"
                  className={linkClass}
                >
                  Yes, open it
                </a>
              ) : (
                'No'
              )}
            </dd>
          </dl>
          <p className="mt-4 text-xs text-ink/60 dark:text-paper/60">
            Deployed plugins: {pluginSubdomains.length ? pluginSubdomains.join(', ') : 'none'}. A
            new app is created with <code>pnpm new:plugin &lt;id&gt;</code> and deployed by merging
            to main; the subdomain must also point to the site in hPanel.
          </p>
        </Panel>
      </div>

      <Panel className="mt-6 max-w-3xl">
        <h2 className="mb-1 font-semibold">Logo</h2>
        <p className="mb-4 text-xs text-ink/60 dark:text-paper/60">
          Shown on the landing page, the account pages and here. Users who manage this project can
          change it too, from their account page.
        </p>
        <ProjectAvatarEditor
          projectId={project.id}
          project={{
            name: project.name,
            slug: project.slug,
            pluginId: project.plugin_id,
            description: project.description,
          }}
          color={logo.color}
          symbol={logo.symbol}
        />
      </Panel>
    </>
  );
}

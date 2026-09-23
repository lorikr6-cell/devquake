import { requireAdmin } from '@/lib/auth/admin';
import { listProjects } from '@/lib/admin/ideas';
import { PageHeader, Panel } from '../../../_components/ui';
import { createIdeaAction } from '../actions';
import { IdeaForm } from '../idea-form';

export const metadata = { title: 'New idea' };

type Props = { searchParams: Promise<{ project?: string }> };

export default async function NewIdeaPage({ searchParams }: Props) {
  await requireAdmin();
  const { project } = await searchParams;
  const projects = await listProjects();

  return (
    <>
      <PageHeader title="New idea" />
      <Panel className="max-w-3xl">
        <IdeaForm
          action={createIdeaAction}
          projects={projects}
          defaultProjectId={Number(project) || undefined}
          submitLabel="Create idea"
        />
      </Panel>
    </>
  );
}

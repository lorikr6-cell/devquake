import Link from 'next/link';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { PageHeader, Panel, linkClass } from '../../../_components/ui';
import { createProjectAction } from '../actions';
import { ProjectForm } from '../project-form';

export const metadata = { title: 'New project' };

const ERRORS: Record<string, string> = {
  invalid: 'Name is required and the slug may only contain a-z, 0-9 and dashes.',
  duplicate: 'A project with this slug already exists.',
};

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewProjectPage({ searchParams }: Props) {
  await requireAdmin();
  const { error } = await searchParams;
  return (
    <>
      <PageHeader
        title="New project"
        actions={
          <Link href={`${ADMIN_BASE}/projects`} className={linkClass}>
            ← All projects
          </Link>
        }
      />
      {error && ERRORS[error] && (
        <p
          role="alert"
          className="mb-6 max-w-3xl rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
        >
          {ERRORS[error]}
        </p>
      )}
      <Panel className="max-w-3xl">
        <ProjectForm action={createProjectAction} submitLabel="Create project" />
      </Panel>
    </>
  );
}

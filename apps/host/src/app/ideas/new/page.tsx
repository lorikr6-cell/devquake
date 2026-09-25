import Link from 'next/link';
import { IdeaForm } from '@/components/ideas/idea-form';
import { IdeasShell, IdeasSignIn } from '@/components/ideas/ideas-shell';
import { VotingExplained } from '@/components/ideas/voting-explained';
import { getSessionUser } from '@/lib/auth/session';
import { ideaProjects } from '@/lib/community-ideas';

export const metadata = { title: 'Share an idea', robots: { index: false } };

export default async function NewIdeaPage() {
  const user = await getSessionUser().catch(() => null);
  if (!user) return <IdeasSignIn path="/ideas/new" />;
  const projects = await ideaProjects();
  return (
    <IdeasShell>
      <Link href="/ideas" className="text-sm text-ink/60 hover:text-quake dark:text-paper/60">
        ← All ideas
      </Link>
      <h1 className="mt-1 font-display text-3xl tracking-tight">Share an idea</h1>
      <p className="mt-1 mb-6 text-sm text-ink/70 dark:text-paper/70">
        For a new app, or to improve one of DevQuake’s projects. A picture helps others imagine it.
      </p>
      <div className="mb-6">
        <VotingExplained />
      </div>
      <IdeaForm projects={projects.map((p) => ({ id: p.id, name: p.name }))} />
    </IdeasShell>
  );
}

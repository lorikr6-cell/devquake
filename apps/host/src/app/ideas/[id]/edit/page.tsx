import { Link } from '@devquake/ui';
import { getT } from '@/i18n/server';
import { notFound } from 'next/navigation';
import { IdeaForm } from '@/components/ideas/idea-form';
import { ideaImageUrl } from '@/components/ideas/idea-bits';
import { IdeasShell, IdeasSignIn } from '@/components/ideas/ideas-shell';
import { getSessionUser } from '@/lib/auth/session';
import { getIdea, ideaProjects, viewerOf } from '@/lib/community-ideas';

export async function generateMetadata() {
  return { title: (await getT('ideas'))('metaEdit'), robots: { index: false } };
}

export default async function EditIdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser().catch(() => null);
  if (!user) return <IdeasSignIn path={`/ideas/${id}/edit`} />;
  const idea = await getIdea(Number(id), viewerOf(user));
  if (!idea || idea.author_user_id !== user.userId) notFound();
  const projects = await ideaProjects();
  const t = await getT('ideas.edit');
  return (
    <IdeasShell>
      <Link
        href={`/ideas/${idea.id}`}
        className="text-sm text-ink/60 hover:text-quake dark:text-paper/60"
      >
        {t('back')}
      </Link>
      <h1 className="mt-1 mb-6 font-display text-3xl tracking-tight">{t('title')}</h1>
      <IdeaForm
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        idea={{
          id: idea.id,
          title: idea.title,
          description: idea.description,
          projectId: idea.project_id,
          isPublic: idea.is_public === 1,
          votesEnabled: idea.votes_enabled === 1,
          commentsEnabled: idea.comments_enabled === 1,
          imageUrl: ideaImageUrl(idea),
        }}
      />
    </IdeasShell>
  );
}

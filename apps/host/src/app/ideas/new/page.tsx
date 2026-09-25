import { Link } from '@devquake/ui';
import { getT } from '@/i18n/server';
import { IdeaForm } from '@/components/ideas/idea-form';
import { IdeasShell, IdeasSignIn } from '@/components/ideas/ideas-shell';
import { VotingExplained } from '@/components/ideas/voting-explained';
import { getSessionUser } from '@/lib/auth/session';
import { ideaProjects } from '@/lib/community-ideas';

export async function generateMetadata() {
  return { title: (await getT('ideas'))('metaNew'), robots: { index: false } };
}

export default async function NewIdeaPage() {
  const user = await getSessionUser().catch(() => null);
  if (!user) return <IdeasSignIn path="/ideas/new" />;
  const projects = await ideaProjects();
  const t = await getT('ideas.new');
  return (
    <IdeasShell>
      <Link href="/ideas" className="text-sm text-ink/60 hover:text-quake dark:text-paper/60">
        {t('back')}
      </Link>
      <h1 className="mt-1 font-display text-3xl tracking-tight">{t('title')}</h1>
      <p className="mt-1 mb-6 text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
      <div className="mb-6">
        <VotingExplained />
      </div>
      <IdeaForm projects={projects.map((p) => ({ id: p.id, name: p.name }))} />
    </IdeasShell>
  );
}

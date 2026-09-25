import { Link, buttonClass, cn } from '@devquake/ui';
import { getT, localized } from '@/i18n/server';
import { IdeaCard } from '@/components/ideas/idea-bits';
import { IdeasShell, IdeasSignIn } from '@/components/ideas/ideas-shell';
import { VotingExplained } from '@/components/ideas/voting-explained';
import { getSessionUser } from '@/lib/auth/session';
import { ideaProjects, listIdeas, viewerOf, type IdeaSort } from '@/lib/community-ideas';

export async function generateMetadata() {
  return { title: (await getT('ideas'))('metaList'), robots: { index: false } };
}

type Props = {
  searchParams: Promise<{ sort?: string; project?: string; mine?: string; deleted?: string }>;
};

export default async function IdeasPage({ searchParams }: Props) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return <IdeasSignIn path="/ideas" />;
  const viewer = viewerOf(user)!;
  const t = await getT('ideas.list');
  const sp = await searchParams;
  const sort: IdeaSort = sp.sort === 'new' ? 'new' : 'top';
  const mine = sp.mine === '1';
  const projectId = sp.project === 'new' ? 0 : sp.project ? Number(sp.project) : null;
  const [ideas, projects] = await Promise.all([
    listIdeas(viewer, { sort, mine, projectId: Number.isNaN(projectId) ? null : projectId }),
    ideaProjects(),
  ]);

  const link = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const merged = {
      sort: sp.sort ?? null,
      project: sp.project ?? null,
      mine: sp.mine ?? null,
      ...changes,
    };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const q = params.toString();
    return q ? `/ideas?${q}` : '/ideas';
  };
  const tab = (active: boolean) =>
    cn(
      'rounded-md px-3 py-1.5 text-sm',
      active
        ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
        : 'text-ink/70 hover:bg-ink/5 dark:text-paper/70 dark:hover:bg-paper/10',
    );

  return (
    <IdeasShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
        </div>
        <Link href="/ideas/new" className={buttonClass()}>
          {t('share')}
        </Link>
      </div>

      <div className="mt-6">
        <VotingExplained compact />
      </div>

      {sp.deleted ? (
        <p
          role="status"
          className="mt-4 rounded-md bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          {t('deleted')}
        </p>
      ) : null}

      <nav aria-label={t('filter')} className="mt-6 flex flex-wrap items-center gap-2">
        <Link href={link({ sort: null, mine: null })} className={tab(sort === 'top' && !mine)}>
          {t('top')}
        </Link>
        <Link href={link({ sort: 'new', mine: null })} className={tab(sort === 'new' && !mine)}>
          {t('newest')}
        </Link>
        <Link href={link({ mine: '1' })} className={tab(mine)}>
          {t('mine')}
        </Link>
        <form
          action={await localized('/ideas')}
          className="ml-auto flex items-center gap-2 text-sm"
        >
          {sp.sort ? <input type="hidden" name="sort" value={sp.sort} /> : null}
          {mine ? <input type="hidden" name="mine" value="1" /> : null}
          <label htmlFor="idea-filter-project" className="text-ink/60 dark:text-paper/60">
            {t('for')}
          </label>
          <select
            id="idea-filter-project"
            name="project"
            defaultValue={sp.project ?? ''}
            className="rounded-md border border-ink/20 bg-white px-2 py-1 dark:border-paper/20 dark:bg-paper/5"
          >
            <option value="">{t('everything')}</option>
            <option value="new">{t('newApp')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-ink/20 px-2 py-1 dark:border-paper/20"
          >
            {t('show')}
          </button>
        </form>
      </nav>

      {ideas.length === 0 ? (
        <p className="mt-6 text-sm text-ink/60 dark:text-paper/60">
          {mine ? t('noneMine') : t('none')}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} viewer={viewer} />
          ))}
        </ul>
      )}
    </IdeasShell>
  );
}

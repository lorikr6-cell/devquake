import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { NewEntry } from '../components/new-entry';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.new') };
}

/** A new vault entry (the wizard; encryption happens in the browser). */
export default async function NewEntryPage({ ctx }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const t = translator(localeOf(ctx), 'wizard');
  const people = ((await ctx.people?.referrals().catch(() => [])) ?? []).map((p) => ({
    id: p.id,
    displayName: p.displayName,
    hasAccess: p.hasAccess,
  }));
  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-ink/60 hover:text-quake dark:text-paper/60">
        {t('backHome')}
      </Link>
      <h1 className="font-display text-3xl font-bold">{t('pageTitle')}</h1>
      <NewEntry people={people} hostUrl={ctx.hostUrl} />
    </div>
  );
}

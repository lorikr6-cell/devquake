import { redirect } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, localizePath } from '@devquake/ui';
import { pageScope } from '../components/guard';
import { SetupForm } from '../components/setup-form';
import { localeOf, translator } from '../i18n';
import { getSetup, listEquipment } from '../lib/data';
import { listPhotos } from '../lib/progress';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.profile') };
}

/** Profile, places and home equipment; saving can create the routines again. */
export default async function Profile({ ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const locale = localeOf(ctx);
  const t = translator(locale);
  const [setup, equipment, photos] = await Promise.all([
    getSetup(scope.db, scope.user.id),
    listEquipment(scope.db),
    listPhotos(scope.db, scope.user.id),
  ]);
  const start = photos.find((p) => p.kind === 'start');
  if (!setup) redirect(localizePath('/setup', locale));
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/" className="text-sm text-ink/70 hover:text-quake dark:text-paper/70">
        ← {t('nav.dashboard')}
      </Link>
      <h1 className="mt-2 mb-4 font-display text-3xl font-bold">{t('profile.title')}</h1>
      <SetupForm
        mode="edit"
        initial={setup}
        equipment={equipment}
        year={new Date().getUTCFullYear()}
        startPhoto={start ? { id: start.id, version: start.version } : null}
      />
    </div>
  );
}

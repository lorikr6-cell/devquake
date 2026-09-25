import type { PluginPageProps } from '@devquake/plugin-sdk';
import { pageScope } from '../components/guard';
import { SetupForm } from '../components/setup-form';
import { localeOf, translator } from '../i18n';
import { getSetup, listEquipment } from '../lib/data';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.setup') };
}

/** The setup wizard: profile, training, places and home equipment, then the routines. */
export default async function Setup({ ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const [setup, equipment] = await Promise.all([
    getSetup(scope.db, scope.user.id),
    listEquipment(scope.db),
  ]);
  return (
    <SetupForm
      mode="wizard"
      initial={setup}
      equipment={equipment}
      year={new Date().getUTCFullYear()}
    />
  );
}

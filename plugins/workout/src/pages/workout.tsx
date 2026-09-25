import { notFound, redirect } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localizePath } from '@devquake/ui';
import { pageScope } from '../components/guard';
import { WorkoutView } from '../components/workout-view';
import { localeOf, translator } from '../i18n';
import { getSession } from '../lib/data';
import { HttpError } from '../lib/http';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.workout') };
}

/** The guided workout; a finished one opens its summary. */
export default async function Workout({ params, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const sessionId = Number(params.id);
  if (!Number.isSafeInteger(sessionId) || sessionId <= 0) notFound();
  const session = await getSession(scope.db, scope.user.id, sessionId).catch((err) => {
    if (err instanceof HttpError) notFound();
    throw err;
  });
  if (session.status === 'finished') redirect(localizePath(`/history/${sessionId}`, localeOf(ctx)));
  return <WorkoutView initial={session} signInUrl={`${ctx.hostUrl}/#account`} />;
}

import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppAccessGate } from '@/components/app-access-gate';
import { hostUrl } from '@/lib/domain';
import { appAccess, buildPluginContext, isPluginOnline, loadPlugin } from '@/lib/plugins';

export default async function PluginHostLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ plugin: string }>;
}) {
  const { plugin: id } = await params;
  const plugin = await loadPlugin(id);
  if (!plugin || !(await isPluginOnline(id))) notFound();

  // Only subscribers (and assigned users, admins) may use an app; others see how to get access.
  const access = await appAccess(id);
  if (!access.ok) {
    return (
      <AppAccessGate reason={access.reason} projectName={access.projectName} hostUrl={hostUrl()} />
    );
  }
  if (!plugin.layout) return children;

  const { default: Layout } = await plugin.layout();
  return <Layout ctx={buildPluginContext(plugin.manifest)}>{children}</Layout>;
}

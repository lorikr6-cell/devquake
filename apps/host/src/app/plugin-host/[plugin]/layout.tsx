import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppAccessGate } from '@/components/app-access-gate';
import { hostUrl, pluginUrl } from '@/lib/domain';
import {
  appAccess,
  buildPluginContext,
  isPluginOnline,
  isPublicPage,
  loadPlugin,
} from '@/lib/plugins';

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
  // Public pages (ADR 0009), e.g. a user manual, are open to everyone.
  const path = (await headers()).get('x-devquake-path') ?? '/';
  const access = await appAccess(id);
  if (!access.ok && !isPublicPage(plugin.manifest, path)) {
    return (
      <AppAccessGate
        reason={access.reason}
        projectName={access.projectName}
        hostUrl={hostUrl()}
        appUrl={pluginUrl(id)}
      />
    );
  }
  if (!plugin.layout) return children;

  const { default: Layout } = await plugin.layout();
  return <Layout ctx={await buildPluginContext(plugin.manifest)}>{children}</Layout>;
}

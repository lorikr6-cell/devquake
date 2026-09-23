import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { buildPluginContext, loadPlugin } from '@/lib/plugins';

export default async function PluginHostLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ plugin: string }>;
}) {
  const { plugin: id } = await params;
  const plugin = await loadPlugin(id);
  if (!plugin) notFound();
  if (!plugin.layout) return children;

  const { default: Layout } = await plugin.layout();
  return <Layout ctx={buildPluginContext(plugin.manifest)}>{children}</Layout>;
}

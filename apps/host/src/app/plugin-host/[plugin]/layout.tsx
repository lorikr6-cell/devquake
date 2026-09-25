import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
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

  // Without access, the page decides between the access page and a public page (ADR 0009):
  // a layout is not re-rendered on client navigation, so a decision that depends on the path
  // must not be made here (going from /help to / would keep the public page's frame).
  if (!(await appAccess(id)).ok || !plugin.layout) return children;

  const { default: Layout } = await plugin.layout();
  return <Layout ctx={await buildPluginContext(plugin.manifest)}>{children}</Layout>;
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { matchRoute, type SearchParams } from '@devquake/plugin-sdk';
import { appAccess, buildPluginContext, isPublicPage, loadPlugin } from '@/lib/plugins';

type Props = {
  params: Promise<{ plugin: string; path?: string[] }>;
  searchParams: Promise<SearchParams>;
};

async function resolvePage(props: Props) {
  const { plugin: id, path = [] } = await props.params;
  const plugin = await loadPlugin(id);
  if (!plugin) return null;

  const match = matchRoute(Object.keys(plugin.pages), `/${path.join('/')}`);
  if (!match) return null;

  const mod = await plugin.pages[match.pattern]!();
  const pageProps = {
    params: match.params,
    searchParams: await props.searchParams,
    ctx: await buildPluginContext(plugin.manifest),
  };
  return { plugin, mod, pageProps };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const resolved = await resolvePage(props);
  if (!resolved) return {};
  const { plugin, mod, pageProps } = resolved;
  if (mod.generateMetadata) return mod.generateMetadata(pageProps);
  return mod.metadata ?? { title: plugin.manifest.name };
}

export default async function PluginPage(props: Props) {
  // Defence in depth: never run plugin page code for a visitor without access (the layout
  // already shows the access page instead).
  const resolved = await resolvePage(props);
  if (!resolved) notFound();
  const { plugin: id, path = [] } = await props.params;
  if (!(await appAccess(id)).ok && !isPublicPage(resolved.plugin.manifest, `/${path.join('/')}`)) {
    return null;
  }
  const Page = resolved.mod.default;
  return <Page {...resolved.pageProps} />;
}

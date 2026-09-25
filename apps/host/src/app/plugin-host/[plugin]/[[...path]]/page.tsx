import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { matchRoute, type SearchParams } from '@devquake/plugin-sdk';
import { AppAccessGate } from '@/components/app-access-gate';
import { hostUrl, pluginUrl } from '@/lib/domain';
import { appAccess, buildPluginContext, isPublicPage, loadPlugin } from '@/lib/plugins';
import { languageAlternates } from '@/lib/seo-languages';

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
  const meta = mod.generateMetadata
    ? await mod.generateMetadata(pageProps)
    : (mod.metadata ?? { title: plugin.manifest.name });
  // Public pages (ADR 0009) exist in every language (ADR 0011): tell search engines.
  const { path = [] } = await props.params;
  const route = `/${path.join('/')}`;
  if (!isPublicPage(plugin.manifest, route)) return meta;
  const { ctx } = pageProps;
  return {
    ...meta,
    alternates: languageAlternates(ctx.baseUrl, route, ctx.locale ?? 'en'),
  };
}

export default async function PluginPage(props: Props) {
  const resolved = await resolvePage(props);
  if (!resolved) notFound();
  const { plugin, mod, pageProps } = resolved;
  const Page = mod.default;
  const access = await appAccess(plugin.manifest.id);
  if (access.ok) return <Page {...pageProps} />; // the layout already wraps it in the app's frame

  // No access: only subscribers (and assigned users, admins) may use an app; others see how to
  // get access. Public pages (ADR 0009), e.g. a user manual, are open to everyone and get the
  // app's frame here, because the layout skips it for visitors without access. Decided per
  // page, so client navigation (e.g. from /help back to /) always gets the right screen.
  const { path = [] } = await props.params;
  if (!isPublicPage(plugin.manifest, `/${path.join('/')}`)) {
    return (
      <AppAccessGate
        reason={access.reason}
        projectName={access.projectName}
        hostUrl={hostUrl()}
        appUrl={pluginUrl(plugin.manifest.id)}
      />
    );
  }
  if (!plugin.layout) return <Page {...pageProps} />;
  const { default: Layout } = await plugin.layout();
  return (
    <Layout ctx={pageProps.ctx}>
      <Page {...pageProps} />
    </Layout>
  );
}

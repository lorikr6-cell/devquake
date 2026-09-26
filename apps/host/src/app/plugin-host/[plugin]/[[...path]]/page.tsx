import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { after } from 'next/server';
import { matchRoute, type SearchParams } from '@devquake/plugin-sdk';
import { AppAccessGate } from '@/components/app-access-gate';
import { hostUrl, pluginUrl } from '@/lib/domain';
import {
  appAccess,
  buildPluginContext,
  isPublicPage,
  isSignedInRoute,
  loadPlugin,
} from '@/lib/plugins';
import { maybeRunScheduled } from '@/lib/plugin-scheduler';
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
  const pageMeta = mod.generateMetadata
    ? await mod.generateMetadata(pageProps)
    : (mod.metadata ?? { title: plugin.manifest.name });
  // The app's own logo as favicon (ADR 0016), unless the page sets icons itself.
  const iconUrl = pageProps.ctx.app?.iconUrl;
  const meta: Metadata =
    pageMeta.icons || !iconUrl
      ? pageMeta
      : { ...pageMeta, icons: { icon: [{ url: iconUrl, type: 'image/svg+xml' }], apple: iconUrl } };
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
  // The apps' scheduled work runs from traffic, after the response (ADR 0014).
  after(() => maybeRunScheduled());
  const access = await appAccess(plugin.manifest.id);
  if (access.ok) return <Page {...pageProps} />; // the layout already wraps it in the app's frame

  // No access: only subscribers (and assigned users, admins) may use an app; others see how to
  // get access. Public pages (ADR 0009), e.g. a user manual, are open to everyone and get the
  // app's frame here, because the layout skips it for visitors without access. Decided per
  // page, so client navigation (e.g. from /help back to /) always gets the right screen.
  const { path = [] } = await props.params;
  const route = `/${path.join('/')}`;
  // Pages open to every signed-in member (ADR 0022), e.g. a vault entry shared with them.
  const signedInOpen =
    (access.reason === 'subscribe' || access.reason === 'trial-ended') &&
    isSignedInRoute(plugin.manifest, 'pages', route);
  if (!signedInOpen && !isPublicPage(plugin.manifest, route)) {
    return (
      <AppAccessGate
        reason={access.reason}
        projectName={access.projectName}
        projectId={access.projectId}
        canTry={access.canTry}
        cost={access.cost ?? 0}
        missing={access.missing ?? 0}
        pluginId={plugin.manifest.id}
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

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type PluginStatus = 'active' | 'beta' | 'disabled';

/** Static description of a plugin. `id` is also its subdomain: <id>.devquake.com */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  status?: PluginStatus;
}

/** Runtime information the host passes to every plugin page, layout and API handler. */
export interface PluginContext {
  pluginId: string;
  /** e.g. "devquake.com" (or "localhost:3000" in development) */
  rootDomain: string;
  /** Absolute URL of this plugin, e.g. "https://blog.devquake.com" */
  baseUrl: string;
  /** Absolute URL of the host app, e.g. "https://devquake.com" */
  hostUrl: string;
}

export type SearchParams = Record<string, string | string[] | undefined>;

export interface PluginPageProps {
  /** Params extracted from the route pattern, e.g. { id: "42" } for "/posts/:id" */
  params: Record<string, string>;
  searchParams: SearchParams;
  ctx: PluginContext;
}

export interface PluginPageModule {
  default: (props: PluginPageProps) => ReactNode | Promise<ReactNode>;
  metadata?: Metadata;
  generateMetadata?: (props: PluginPageProps) => Metadata | Promise<Metadata>;
}

export interface PluginLayoutProps {
  children: ReactNode;
  ctx: PluginContext;
}

export interface PluginLayoutModule {
  default: (props: PluginLayoutProps) => ReactNode | Promise<ReactNode>;
}

export interface PluginApiArgs {
  params: Record<string, string>;
  ctx: PluginContext;
}

export type PluginApiHandler = (
  request: Request,
  args: PluginApiArgs,
) => Response | Promise<Response>;

/** An API module exports one function per HTTP method, like a Next.js route handler. */
export type PluginApiModule = Partial<Record<HttpMethod, PluginApiHandler>>;

/**
 * The contract every plugin's default export must satisfy.
 * Route patterns: "/", "/about", "/posts/:id", "/docs/*rest".
 * All modules are lazy-loaded so a plugin only costs something when it is visited.
 */
export interface PluginDefinition {
  manifest: PluginManifest;
  layout?: () => Promise<PluginLayoutModule>;
  pages: Record<string, () => Promise<PluginPageModule>>;
  /** Served on <id>.devquake.com/api/<pattern> */
  api?: Record<string, () => Promise<PluginApiModule>>;
}

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
  /**
   * The plugin owns a MySQL database (ADR 0007). The host connects it from the environment
   * variables `<ID>_DB_NAME`, `<ID>_DB_USER`, `<ID>_DB_PWD` (optional `<ID>_DB_HOST`, `<ID>_DB_PORT`)
   * and exposes it as `ctx.db`.
   */
  database?: boolean;
}

/** The signed-in user, as far as a plugin needs to know them (no email, by design). */
export interface PluginUser {
  /** Platform user id: store it as a plain number in the plugin's own tables. */
  id: number;
  displayName: string;
  /** Platform admin or owner. */
  isAdmin: boolean;
}

export interface PluginExecuteResult {
  affectedRows: number;
  insertId: number;
}

/**
 * The plugin's own database. SQL with `?` placeholders only, never string concatenation.
 * Implemented by the host (mysql2); the SDK only defines the shape.
 */
export interface PluginDatabase {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<PluginExecuteResult>;
  /** Runs `fn` in a transaction: committed if it resolves, rolled back if it throws. */
  transaction<T>(fn: (tx: Omit<PluginDatabase, 'transaction'>) => Promise<T>): Promise<T>;
}

/** Someone in the signed-in user's DevQuake referral network (no email, by design). */
export interface PluginPerson {
  id: number;
  displayName: string;
  /** 'referred' = joined DevQuake through the user's referral; 'referrer' = invited the user. */
  relation: 'referred' | 'referrer';
  /** Whether they can already open this app (subscribed, assigned, or admin). */
  hasAccess: boolean;
}

/** People the signed-in user knows on the platform (ADR 0007). */
export interface PluginPeople {
  /** Active accounts the user referred, plus whoever referred the user. */
  referrals(): Promise<PluginPerson[]>;
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
  /** Signed-in user (null when signed out). Undefined for hosts older than ADR 0007. */
  user?: PluginUser | null;
  /** The plugin's own database when `manifest.database` is set and configured (ADR 0007). */
  db?: PluginDatabase;
  /** The signed-in user's referral network; undefined when signed out or on older hosts. */
  people?: PluginPeople;
}

/** Context for platform hooks (no request, no user). */
export interface PluginPlatformContext {
  pluginId: string;
  db?: PluginDatabase;
}

export interface PluginStat {
  label: string;
  value: number;
}

/**
 * Optional hooks the platform calls in-process (ADR 0007). Keep them fast and idempotent.
 */
export interface PluginPlatformModule {
  /** A few labelled numbers for the admin dashboard. */
  getStats?: (ctx: PluginPlatformContext) => Promise<PluginStat[]>;
  /**
   * Remove or anonymise everything this plugin stores about a user. Called when the user deletes
   * their account, before the platform deletes them; throwing aborts the deletion.
   */
  deleteUserData?: (userId: number, ctx: PluginPlatformContext) => Promise<void>;
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
  /** Hooks for the platform: stats and GDPR deletion (ADR 0007). */
  platform?: () => Promise<PluginPlatformModule>;
}

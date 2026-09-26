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
  /**
   * Pages anyone may open without signing in or subscribing, e.g. a user manual (ADR 0009).
   * Exact static paths only. They are listed in the app's sitemap, allowed in its robots.txt
   * and linked from the project card. Everything else stays members-only.
   */
  publicPages?: PluginPublicPage[];
  /**
   * Routes any signed-in DevQuake user may use without access to the app (ADR 0022), e.g. the
   * page where a vault recipient opens an entry shared with them. Route patterns like `pages`
   * and `api` ("/open/:id"). The app itself must check who may see what on these routes.
   */
  signedInRoutes?: { pages?: string[]; api?: string[] };
  /**
   * The app may email active DevQuake users who have no access to it, with
   * `mail.sendToUser(id, compose, { withoutAccess: true })` (ADR 0022). Only for people the app
   * has a reason to write to (e.g. recipients a member chose); never for marketing.
   */
  mailWithoutAccess?: boolean;
}

/** A page of an app that is open to everyone (see `PluginManifest.publicPages`). */
export interface PluginPublicPage {
  /** Exact path, e.g. "/help" (no parameters or wildcards). */
  path: string;
  /** Link text, e.g. "User manual". */
  title: string;
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

/** One release from a plugin's CHANGELOG.md (see parseChangelog). */
export interface PluginChangelogEntry {
  version: string;
  /** As written after the version heading, e.g. "2026-09-24". */
  date?: string;
  /** Bullet points as written (may contain **bold** and `code`). */
  notes: string[];
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
  /** The plugin's own CHANGELOG.md, newest release first (ADR 0008); undefined on older hosts. */
  changelog?: PluginChangelogEntry[];
  /**
   * The visitor's IANA time zone, e.g. "Europe/Bucharest" ("UTC" until known; ADR 0010). Show
   * every timestamp in it (formatDateTime from @devquake/ui); store and send UTC only.
   */
  timeZone?: string;
  /**
   * The page language (ADR 0011): 'en' | 'de' | 'ro' | 'hu'; undefined (= 'en') on older hosts.
   * Show every text in it (the app's own catalogs) and keep it in links (`Link`,
   * `localizePath` from @devquake/ui).
   */
  locale?: PluginLocale;
  /**
   * The signed-in person's session (ADR 0014); null when signed out, undefined on older hosts.
   * Apps with long uninterrupted use (a workout) can keep it from ending mid-way.
   */
  session?: PluginSession | null;
  /**
   * The app as DevQuake shows it (ADR 0016): its project's name and logo. Show the icon next to
   * the app's name in the toolbar. Undefined on older hosts.
   */
  app?: PluginAppIdentity;
}

/** The app's project name and logo (an SVG on the host, safe for <img src>). */
export interface PluginAppIdentity {
  name: string;
  /** Absolute URL of the logo (SVG, square). */
  iconUrl: string;
}

export type PluginLocale = 'en' | 'de' | 'ro' | 'hu';

/** The signed-in person's session, as far as an app may touch it (ADR 0014). */
export interface PluginSession {
  /** When the session ends unless it is extended (ISO time, UTC). */
  expiresAt: string;
  /**
   * Pushes the session's end to at least `hours` (1–3) from now, never beyond 24 hours after
   * sign-in, and renews the cookie. Returns the new end. Only works in API handlers (pages
   * cannot set cookies). Use it only while the person is actively using the app.
   */
  extend(hours?: number): Promise<string>;
}

/**
 * A branded email written by an app (ADR 0014). Plain text only: the host escapes everything
 * and puts it into the DevQuake email layout, in the recipient's language.
 */
export interface PluginEmail {
  subject: string;
  /** Short text shown in the inbox list after the subject. */
  preheader?: string;
  heading: string;
  paragraphs: string[];
  /** A small two-column table, e.g. monthly statistics. */
  rows?: [label: string, value: string][];
  button?: { label: string; url: string };
  /** Small print under the content, e.g. how to turn these emails off. */
  footer?: string;
}

/** Sends emails to people without giving the app their address (ADR 0014). */
export interface PluginMailer {
  /**
   * Sends one email to a platform user who can use this app (subscriber, assigned user or
   * admin, with an active account), composed in their language. Returns false when nothing was
   * sent (unknown or inactive account, no access to the app, or a failed send).
   */
  sendToUser(
    userId: number,
    compose: (locale: PluginLocale) => PluginEmail | Promise<PluginEmail>,
    options?: PluginMailOptions,
  ): Promise<boolean>;
}

/** Options of `PluginMailer.sendToUser` (ADR 0022). */
export interface PluginMailOptions {
  /**
   * Also send when the person has no access to the app (they must still have an active
   * account). Only honoured for apps with `manifest.mailWithoutAccess`.
   */
  withoutAccess?: boolean;
}

/** Context for platform hooks (no request, no user). */
export interface PluginPlatformContext {
  pluginId: string;
  db?: PluginDatabase;
}

/** Context for the `scheduled` hook (ADR 0014). */
export interface PluginScheduledContext extends PluginPlatformContext {
  /** Absolute URL of this app, e.g. "https://workout.devquake.com", for links in emails. */
  baseUrl: string;
  /** The time of this run (injectable for tests). */
  now: Date;
  mail: PluginMailer;
  /**
   * When each of these people was last active anywhere on DevQuake (sign-in or any page or app
   * with their session), as ISO times in UTC; null when never. Undefined on older hosts
   * (ADR 0022).
   */
  lastActiveAt?: (userIds: number[]) => Promise<Record<number, string | null>>;
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
  /**
   * Background work, e.g. a monthly email (ADR 0014). The host runs it at most once an hour
   * (from site traffic, or a cron call to /api/scheduled), so it must be idempotent: record
   * what was done in the app's own database and skip it next time. Keep each run short
   * (handle a limited batch; the rest is done in the next run). Errors are logged, not shown.
   */
  scheduled?: (ctx: PluginScheduledContext) => Promise<void>;
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

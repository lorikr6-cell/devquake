/**
 * Branded transactional emails (docs/brand.md). Table layout and inline styles only, because
 * email clients ignore <style> blocks, most block SVG and none load web fonts: the logo and
 * banners are PNGs rendered from the real brand assets (scripts/render-email-images.mjs) and
 * served from apps/host/public/brand. Every image has alt text for clients that block images.
 * Every dynamic value goes through `esc()`. The only contact address is CONTACT_EMAIL.
 *
 * Emails to members and visitors are written in the recipient's language (`locale`, texts in
 * src/i18n/messages/email.ts, ADR 0011); the internal notification to the owner is English.
 */
import { DEFAULT_LOCALE, localizePath, type Locale, type Translate } from '@devquake/ui';
import { translatorFor } from '../../i18n/translate';
import { CONTACT_EMAIL } from '../legal';

export { CONTACT_EMAIL };

const INK = '#16181D';
const PAPER = '#F4F1EA';
const QUAKE = '#E4572E';
const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface Email {
  subject: string;
  html: string;
  text: string;
}

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Email texts in a language (the translator escapes nothing: escape what you insert). */
function texts(locale: Locale | undefined): Translate {
  return translatorFor(locale ?? DEFAULT_LOCALE, 'email');
}

/** A translated sentence with HTML inserted for {placeholders}; the text itself is escaped. */
function html(template: string, values: Record<string, string>): string {
  return template
    .split(/\{(\w+)\}/g)
    .map((part, i) => (i % 2 === 1 ? (values[part] ?? `{${part}}`) : esc(part)))
    .join('');
}

interface LayoutArgs {
  siteUrl: string;
  locale?: Locale;
  preheader: string;
  heading: string;
  bodyHtml: string;
  bodyText: string;
  subject: string;
  /** Optional full-width banner under the logo bar (PNG in public/brand, 560px wide @3x). */
  banner?: { src: string; alt: string };
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px"><tr>
<td style="background:${INK};border-radius:6px"><a href="${esc(href)}" style="display:inline-block;padding:12px 22px;font:600 15px ${FONT};color:${PAPER};text-decoration:none">${esc(label)}</a></td>
</tr></table>`;
}

const mailto = `<a href="mailto:${CONTACT_EMAIL}" style="color:${INK}">${CONTACT_EMAIL}</a>`;

function layout(a: LayoutArgs): Email {
  const team = texts(a.locale)('team');
  const lang = a.locale ?? DEFAULT_LOCALE;
  const page = `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><title>${esc(a.subject)}</title></head>
<body style="margin:0;padding:0;background:${PAPER}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(a.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td bgcolor="${INK}" style="background:${INK};border-radius:10px 10px 0 0;padding:18px 24px">
<a href="${esc(a.siteUrl)}" style="text-decoration:none"><img src="${esc(a.siteUrl)}/brand/email-logo.png" width="200" height="40" alt="DevQuake" style="display:block;border:0;outline:none;color:${PAPER};font:800 22px ${FONT}"></a>
</td></tr>
${
  a.banner
    ? `<tr><td bgcolor="${INK}" style="background:${INK};padding:0;line-height:0;font-size:0"><img src="${esc(a.siteUrl)}${esc(a.banner.src)}" width="560" alt="${esc(a.banner.alt)}" style="display:block;width:100%;max-width:560px;height:auto;border:0;color:${PAPER};font:800 20px/1.4 ${FONT}"></td></tr>`
    : ''
}
<tr><td style="background:#ffffff;border-top:4px solid ${QUAKE};padding:28px 24px;font:15px/1.6 ${FONT};color:${INK}">
<h1 style="margin:0 0 16px;font:800 22px/1.3 ${FONT};letter-spacing:-0.01em;color:${INK}">${esc(a.heading)}</h1>
${a.bodyHtml}
</td></tr>
<tr><td style="background:#ffffff;border-radius:0 0 10px 10px;border-top:1px solid #e7e3da;padding:18px 24px;font:13px/1.6 ${FONT};color:#5b5e66">
${esc(team)}<br>
${mailto} &middot; <a href="${esc(a.siteUrl)}" style="color:${INK}">${esc(a.siteUrl.replace(/^https?:\/\//, ''))}</a>
</td></tr>
</table></td></tr></table></body></html>`;

  const text = `${a.heading}\n\n${a.bodyText}\n\n--\n${team}\n${CONTACT_EMAIL} · ${a.siteUrl}\n`;
  return { subject: a.subject, html: page, text };
}

function codeBlock(code: string): string {
  return `<p style="margin:20px 0;text-align:center"><span style="display:inline-block;padding:14px 22px;background:${PAPER};border:1px solid #e7e3da;border-radius:8px;font:700 30px/1 'SFMono-Regular',Consolas,monospace;letter-spacing:8px;color:${INK}">${esc(code)}</span></p>`;
}

/** A page of the site in the recipient's language, e.g. https://devquake.com/de/account. */
function pageUrl(siteUrl: string, path: string, locale: Locale | undefined): string {
  return `${siteUrl}${localizePath(path, locale ?? DEFAULT_LOCALE)}`;
}

export interface RequestContext {
  /** e.g. "Cluj-Napoca, Romania" or null */
  location: string | null;
  /** e.g. "Chrome 124 on Windows 10/11" or null */
  device: string | null;
  vpn: string | null;
}

function requestContextHtml(c: RequestContext, t: Translate): { html: string; text: string } {
  const parts = [
    c.location && t('context.location', { value: c.location }),
    c.device && t('context.device', { value: c.device }),
    c.vpn && t('context.network', { value: c.vpn }),
  ].filter(Boolean) as string[];
  if (parts.length === 0) return { html: '', text: '' };
  return {
    html: `<p style="margin:16px 0 0;padding:12px 14px;background:${PAPER};border-radius:6px;font-size:13px;color:#3d4048">${parts.map(esc).join('<br>')}</p>`,
    text: `\n${parts.join('\n')}`,
  };
}

export function signInCodeEmail(args: {
  siteUrl: string;
  name: string;
  code: string;
  minutes: number;
  context: RequestContext;
  forAdmin: boolean;
  locale?: Locale;
}): Email {
  const t = texts(args.locale);
  const ctx = requestContextHtml(args.context, t);
  const where = args.forAdmin ? t('code.whereAdmin') : t('code.where');
  return layout({
    siteUrl: args.siteUrl,
    locale: args.locale,
    subject: t('code.subject', { code: args.code }),
    preheader: t('code.preheader', { minutes: args.minutes }),
    heading: t('code.heading'),
    bodyHtml: `<p style="margin:0">${esc(t('hi', { name: args.name }))}</p>
<p>${esc(t('code.body', { where, minutes: args.minutes }))}</p>
${codeBlock(args.code)}${ctx.html}
<p style="margin:16px 0 0">${html(t('code.warning'), { email: mailto })}</p>`,
    bodyText: `${t('hi', { name: args.name })}\n\n${t('code.text', { where, code: args.code })}\n${t('code.textExpires', { minutes: args.minutes })}${ctx.text}\n\n${t('code.textWarning', { email: CONTACT_EMAIL })}`,
  });
}

/** Welcome email after sign-up: the account only becomes active through the link. */
export function welcomeActivationEmail(args: {
  siteUrl: string;
  name: string;
  activationUrl: string;
  hours: number;
  locale?: Locale;
}): Email {
  const t = texts(args.locale);
  const lang = args.locale ?? DEFAULT_LOCALE;
  return layout({
    siteUrl: args.siteUrl,
    locale: args.locale,
    subject: t('welcome.subject'),
    preheader: t('welcome.preheader', { hours: args.hours }),
    heading: t('welcome.heading', { name: args.name }),
    banner: {
      src:
        lang === DEFAULT_LOCALE ? '/brand/email-welcome.png' : `/brand/email-welcome-${lang}.png`,
      alt: t('welcome.bannerAlt'),
    },
    bodyHtml: `<p style="margin:0">${esc(t('welcome.intro'))}</p>
<p style="margin:16px 0 0">${esc(t('welcome.step'))}</p>
${button(args.activationUrl, t('welcome.button'))}
<p style="margin:0;font-size:13px;color:#5b5e66">${esc(t('welcome.linkNote', { hours: args.hours }))}<br><a href="${esc(args.activationUrl)}" style="color:${INK};word-break:break-all">${esc(args.activationUrl)}</a></p>
<p style="margin:24px 0 8px"><strong>${esc(t('welcome.after'))}</strong></p>
<ol style="margin:0;padding-left:20px">
<li style="margin:0 0 6px">${esc(t('welcome.after1'))}</li>
<li style="margin:0 0 6px">${esc(t('welcome.after2'))}</li>
<li style="margin:0 0 6px">${html(t('welcome.after3'), { account: `<strong>${esc(t('welcome.account'))}</strong>` })}</li>
</ol>
<p style="margin:20px 0 0;font-size:13px;color:#5b5e66">${esc(t('welcome.notYou'))}</p>`,
    bodyText: `${t('welcome.textHeading', { name: args.name })}

${t('welcome.textIntro', { hours: args.hours })}

${args.activationUrl}

${t('welcome.textAfter')}

${t('welcome.textNotYou')}`,
  });
}

/** "Forgot your password?": the link to choose a new one (ADR 0017). */
export function passwordResetEmail(args: {
  siteUrl: string;
  name: string;
  resetUrl: string;
  minutes: number;
  locale?: Locale;
}): Email {
  const t = texts(args.locale);
  return layout({
    siteUrl: args.siteUrl,
    locale: args.locale,
    subject: t('reset.subject'),
    preheader: t('reset.preheader', { minutes: args.minutes }),
    heading: t('reset.heading'),
    bodyHtml: `<p style="margin:0">${esc(t('hi', { name: args.name }))}</p>
<p>${esc(t('reset.body'))}</p>
${button(args.resetUrl, t('reset.button'))}
<p style="margin:0;font-size:13px;color:#5b5e66">${esc(t('reset.linkNote', { minutes: args.minutes }))}<br><a href="${esc(args.resetUrl)}" style="color:${INK};word-break:break-all">${esc(args.resetUrl)}</a></p>
<p style="margin:20px 0 0;font-size:13px;color:#5b5e66">${esc(t('reset.notYou'))}</p>`,
    bodyText: `${t('hi', { name: args.name })}

${t('reset.body')}

${args.resetUrl}

${t('reset.linkNote', { minutes: args.minutes })}

${t('reset.notYou')}`,
  });
}

/** Sent after the password was changed with a reset link. */
export function passwordChangedEmail(args: {
  siteUrl: string;
  name: string;
  locale?: Locale;
}): Email {
  const t = texts(args.locale);
  return layout({
    siteUrl: args.siteUrl,
    locale: args.locale,
    subject: t('passwordChanged.subject'),
    preheader: t('passwordChanged.preheader'),
    heading: t('passwordChanged.heading'),
    bodyHtml: `<p style="margin:0">${esc(t('hi', { name: args.name }))}</p>
<p>${esc(t('passwordChanged.body'))}</p>
<p style="margin:16px 0 0">${html(t('passwordChanged.notYou'), { email: mailto })}</p>`,
    bodyText: `${t('hi', { name: args.name })}

${t('passwordChanged.body')}

${t('passwordChanged.notYou', { email: CONTACT_EMAIL })}`,
  });
}

export function accountLockedEmail(args: {
  siteUrl: string;
  name: string;
  hours: number;
  context: RequestContext;
  locale?: Locale;
}): Email {
  const t = texts(args.locale);
  const ctx = requestContextHtml(args.context, t);
  const hours = t('locked.hours', { count: args.hours });
  return layout({
    siteUrl: args.siteUrl,
    locale: args.locale,
    subject: t('locked.subject'),
    preheader: t('locked.preheader', { hours: args.hours }),
    heading: t('locked.heading'),
    bodyHtml: `<p style="margin:0">${esc(t('hi', { name: args.name }))}</p>
<p>${html(t('locked.body'), { hours: `<strong>${esc(hours)}</strong>` })}</p>${ctx.html}
<p style="margin:16px 0 0">${html(t('locked.notYou'), { email: mailto })}</p>`,
    bodyText: `${t('hi', { name: args.name })}\n\n${t('locked.body', { hours })}${ctx.text}\n\n${t('locked.notYou', { email: CONTACT_EMAIL })}`,
  });
}

/**
 * One change an administrator made to an account, worded in the recipient's language.
 * `role` is a role name from the database, unless `adminRole` marks the control-panel role;
 * `projectRole` is viewer | member | manager | subscribed.
 */
export type AccountChange =
  | { kind: 'roleGranted' | 'roleRemoved'; role: string; adminRole?: boolean }
  | { kind: 'projectAdded' | 'projectRole'; project: string; projectRole: string }
  | { kind: 'projectRemoved' | 'subscribed' | 'unsubscribed'; project: string }
  | { kind: 'disabled' | 'activated' | 'unlocked' | 'nowOwner' };

/** The change as a sentence (email, activity log). */
export function describeAccountChange(change: AccountChange, locale?: Locale): string {
  const t = texts(locale);
  const projectRole = (role: string) =>
    ['viewer', 'member', 'manager', 'subscribed'].includes(role)
      ? t(`changed.projectRoles.${role}`)
      : role;
  switch (change.kind) {
    case 'roleGranted':
    case 'roleRemoved':
      return t(`changed.items.${change.kind}`, {
        role: change.adminRole ? t('changed.adminRole') : change.role,
      });
    case 'projectAdded':
    case 'projectRole':
      return t(`changed.items.${change.kind}`, {
        project: change.project,
        role: projectRole(change.projectRole),
      });
    case 'projectRemoved':
    case 'subscribed':
    case 'unsubscribed':
      return t(`changed.items.${change.kind}`, { project: change.project });
    default:
      return t(`changed.items.${change.kind}`);
  }
}

export interface AccountChangeProject {
  name: string;
  role: string;
  url: string | null;
}

export function accountChangedEmail(args: {
  siteUrl: string;
  name: string;
  changes: AccountChange[];
  isAdmin: boolean;
  adminUrl: string;
  projects: AccountChangeProject[];
  disabled: boolean;
  locale?: Locale;
}): Email {
  const t = texts(args.locale);
  const lines = args.changes.map((c) => describeAccountChange(c, args.locale));
  const role = (r: string) =>
    ['viewer', 'member', 'manager', 'subscribed'].includes(r) ? t(`changed.projectRoles.${r}`) : r;
  const list = lines.map((c) => `<li style="margin:0 0 6px">${esc(c)}</li>`).join('');
  const projects = args.projects
    .map(
      (p) =>
        `<li style="margin:0 0 6px"><strong>${esc(p.name)}</strong> (${esc(role(p.role))})${
          p.url ? ` — <a href="${esc(p.url)}" style="color:${INK}">${esc(p.url)}</a>` : ''
        }</li>`,
    )
    .join('');

  const signInUrl = `${pageUrl(args.siteUrl, '/', args.locale)}#account`;
  const accountUrl = pageUrl(args.siteUrl, '/account', args.locale);
  const account = `<strong>${esc(t('changed.account'))}</strong>`;
  const steps: string[] = [];
  const stepsText: string[] = [];
  if (args.disabled) {
    steps.push(esc(t('changed.disabled')));
    stepsText.push(t('changed.disabled'));
  } else {
    steps.push(
      html(t('changed.signIn'), {
        link: `<a href="${esc(signInUrl)}" style="color:${INK}">${esc(args.siteUrl.replace(/^https?:\/\//, ''))}</a>`,
      }),
      html(t('changed.open'), { account }),
    );
    stepsText.push(
      t('changed.signIn', { link: signInUrl }),
      t('changed.open', { account: t('changed.account') }),
    );
    if (args.isAdmin) {
      steps.push(
        html(t('changed.admin'), {
          link: `<a href="${esc(args.adminUrl)}" style="color:${INK}">${esc(args.adminUrl)}</a>`,
        }),
      );
      stepsText.push(t('changed.admin', { link: args.adminUrl }));
    }
  }

  return layout({
    siteUrl: args.siteUrl,
    locale: args.locale,
    subject: t('changed.subject'),
    preheader: lines[0] ?? t('changed.preheader'),
    heading: t('changed.heading'),
    bodyHtml: `<p style="margin:0">${esc(t('hi', { name: args.name }))}</p>
<p>${esc(t('changed.intro'))}</p>
<ul style="margin:0 0 16px;padding-left:20px">${list}</ul>
${projects ? `<p style="margin:0 0 8px"><strong>${esc(t('changed.projects'))}</strong></p><ul style="margin:0 0 16px;padding-left:20px">${projects}</ul>` : ''}
<p style="margin:0 0 8px"><strong>${esc(t('changed.next'))}</strong></p>
<ol style="margin:0;padding-left:20px">${steps.map((s) => `<li style="margin:0 0 6px">${s}</li>`).join('')}</ol>
${args.disabled ? '' : button(accountUrl, t('changed.button'))}
<p style="margin:8px 0 0">${html(t('changed.questions'), { email: mailto })}</p>`,
    bodyText: `${t('hi', { name: args.name })}\n\n${t('changed.intro')}\n${lines
      .map((c) => `- ${c}`)
      .join('\n')}\n${
      args.projects.length
        ? `\n${t('changed.projects')}:\n${args.projects.map((p) => `- ${p.name} (${role(p.role)})${p.url ? ` ${p.url}` : ''}`).join('\n')}\n`
        : ''
    }\n${t('changed.next')}:\n${stepsText.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n${t('changed.questions', { email: CONTACT_EMAIL })}`,
  });
}

/** Internal notification to contact@devquake.com for a contact-form message (English). */
export function contactNotificationEmail(args: {
  siteUrl: string;
  adminUrl: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  context: RequestContext;
}): Email {
  const ctx = requestContextHtml(args.context, texts(DEFAULT_LOCALE));
  const title = args.subject ? `Contact: ${args.subject}` : `Contact message from ${args.name}`;
  return layout({
    siteUrl: args.siteUrl,
    subject: title.slice(0, 150),
    preheader: args.message.slice(0, 120),
    heading: 'New contact message',
    bodyHtml: `<p style="margin:0"><strong>${esc(args.name)}</strong> &lt;<a href="mailto:${esc(args.email)}" style="color:${INK}">${esc(args.email)}</a>&gt;</p>
${args.subject ? `<p style="margin:8px 0 0"><strong>Subject:</strong> ${esc(args.subject)}</p>` : ''}
<div style="margin:16px 0 0;padding:14px 16px;background:${PAPER};border-left:4px solid ${QUAKE};border-radius:4px;white-space:pre-wrap">${esc(args.message)}</div>${ctx.html}
<p style="margin:16px 0 0">Reply to this email to answer ${esc(args.name)} directly.</p>
${button(`${args.adminUrl}/messages`, 'Open messages')}`,
    bodyText: `From: ${args.name} <${args.email}>
${
  args.subject
    ? `Subject: ${args.subject}
`
    : ''
}
${args.message}${ctx.text}

Reply to this email to answer directly. All messages: ${args.adminUrl}/messages`,
  });
}

/** Invitation from a member: QR code + link, and who invited them. */
export function referralInviteEmail(args: {
  siteUrl: string;
  inviterName: string;
  inviteUrl: string;
  qrUrl: string;
  locale?: Locale;
}): Email {
  const t = texts(args.locale);
  const lang = args.locale ?? DEFAULT_LOCALE;
  const name = args.inviterName;
  const strongName = `<strong>${esc(name)}</strong>`;
  return layout({
    siteUrl: args.siteUrl,
    locale: args.locale,
    subject: t('invite.subject', { name }),
    preheader: t('invite.preheader', { name }),
    heading: t('invite.subject', { name }),
    banner: {
      src:
        lang === DEFAULT_LOCALE ? '/brand/email-welcome.png' : `/brand/email-welcome-${lang}.png`,
      alt: t('welcome.bannerAlt'),
    },
    bodyHtml: `<p style="margin:0">${html(t('invite.body'), { name: strongName })}</p>
<p style="margin:16px 0 0">${esc(t('invite.create'))}</p>
${button(args.inviteUrl, t('invite.button'))}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 0"><tr>
<td style="padding:10px;background:#ffffff;border:1px solid #e7e3da;border-radius:8px"><img src="${esc(args.qrUrl)}" width="140" height="140" alt="${esc(t('invite.qrAlt'))}" style="display:block;border:0"></td>
<td style="padding-left:16px;font-size:13px;color:#5b5e66">${esc(t('invite.scan'))}<br>${esc(t('invite.copy'))}<br><a href="${esc(args.inviteUrl)}" style="color:${INK};word-break:break-all">${esc(args.inviteUrl)}</a></td>
</tr></table>
<p style="margin:20px 0 0;font-size:13px;color:#5b5e66">${esc(t('invite.why', { name }))}</p>`,
    bodyText: `${t('invite.body', { name })}\n\n${t('invite.textCreate')}\n${args.inviteUrl}\n\n${t('invite.why', { name })}`,
  });
}

/** Confirmation after an account was deleted (by its member or by the owner). */
export function accountDeletedEmail(args: {
  siteUrl: string;
  name: string;
  /** Removed by the site owner (e.g. an inactive account) rather than by the user. */
  byOwner?: boolean;
  locale?: Locale;
}): Email {
  const t = texts(args.locale);
  const why = args.byOwner ? t('deleted.byOwner') : t('deleted.bySelf');
  const home = pageUrl(args.siteUrl, '/', args.locale);
  return layout({
    siteUrl: args.siteUrl,
    locale: args.locale,
    subject: t('deleted.subject'),
    preheader: t('deleted.preheader'),
    heading: t('deleted.heading'),
    bodyHtml: `<p style="margin:0">${esc(t('hi', { name: args.name }))}</p>
<p>${esc(t('deleted.body', { why }))}</p>
<p>${esc(t('deleted.welcomeBack'))}</p>
${button(home, t('deleted.button'))}
<p style="margin:8px 0 0">${html(t('deleted.notYou'), { email: mailto })}</p>`,
    bodyText: `${t('hi', { name: args.name })}

${t('deleted.textBody', { why })} ${t('deleted.textWelcomeBack', { url: home })}

${t('deleted.notYou', { email: CONTACT_EMAIL })}`,
  });
}

/**
 * The owner's reply to a contact message. Members also find it on their account
 * (`messagesPath`); visitors who wrote without an account only get this email.
 */
export function contactReplyEmail(args: {
  siteUrl: string;
  name: string;
  subject: string | null;
  original: string;
  reply: string;
  /** Path of the member's messages (e.g. /account/messages), or null without an account. */
  messagesPath: string | null;
  locale?: Locale;
}): Email {
  const t = texts(args.locale);
  const topic = args.subject ?? t('reply.yourMessage');
  const quote = args.original.length > 600 ? `${args.original.slice(0, 600)}…` : args.original;
  const wrote = args.subject
    ? t('reply.youWroteAbout', { subject: args.subject })
    : t('reply.youWrote');
  const messagesUrl = args.messagesPath
    ? pageUrl(args.siteUrl, args.messagesPath, args.locale)
    : null;
  return layout({
    siteUrl: args.siteUrl,
    locale: args.locale,
    subject: t('reply.subject', { topic }).slice(0, 150),
    preheader: args.reply.slice(0, 120),
    heading: t('reply.heading'),
    bodyHtml: `<p style="margin:0">${esc(t('hi', { name: args.name }))}</p>
<div style="margin:16px 0 0;padding:14px 16px;background:${PAPER};border-left:4px solid ${QUAKE};border-radius:4px;white-space:pre-wrap">${esc(args.reply)}</div>
<p style="margin:20px 0 4px;color:#555"><strong>${esc(wrote)}</strong></p>
<div style="margin:0;padding:10px 14px;border-left:3px solid #ccc;color:#555;white-space:pre-wrap">${esc(quote)}</div>
${
  messagesUrl
    ? `${button(messagesUrl, t('reply.button'))}<p style="margin:8px 0 0">${esc(t('reply.answerThere'))}</p>`
    : `<p style="margin:16px 0 0">${html(t('reply.answerEmail'), { email: mailto })}</p>`
}`,
    bodyText: `${t('hi', { name: args.name })}

${args.reply}

${wrote}
${quote}

${messagesUrl ? t('reply.textSee', { url: messagesUrl }) : t('reply.answerEmail', { email: CONTACT_EMAIL })}`,
  });
}

/**
 * An email written by an app (ADR 0014). The app supplies plain texts only; everything is
 * escaped here and laid out like every other DevQuake email.
 */
export function pluginEmail(args: {
  siteUrl: string;
  locale?: Locale;
  content: {
    subject: string;
    preheader?: string;
    heading: string;
    paragraphs: string[];
    rows?: [string, string][];
    button?: { label: string; url: string };
    footer?: string;
  };
}): Email {
  const c = args.content;
  const paragraph = (text: string) => `<p style="margin:0 0 12px">${esc(text)}</p>`;
  const rows = c.rows?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 12px;border-collapse:collapse">${c.rows
        .map(
          ([label, value]) =>
            `<tr><td style="padding:8px 0;border-bottom:1px solid #e7e3da;color:#5b5e66">${esc(label)}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #e7e3da;font-weight:700">${esc(value)}</td></tr>`,
        )
        .join('')}</table>`
    : '';
  const safeUrl = c.button && /^https?:\/\//.test(c.button.url) ? c.button.url : null;
  const bodyHtml = [
    c.paragraphs.map(paragraph).join(''),
    rows,
    c.button && safeUrl ? button(safeUrl, c.button.label) : '',
    c.footer ? `<p style="margin:20px 0 0;font-size:13px;color:#5b5e66">${esc(c.footer)}</p>` : '',
  ].join('');
  const bodyText = [
    c.paragraphs.join('\n\n'),
    c.rows?.map(([l, v]) => `${l}: ${v}`).join('\n') ?? '',
    c.button && safeUrl ? `${c.button.label}: ${safeUrl}` : '',
    c.footer ?? '',
  ]
    .filter(Boolean)
    .join('\n\n');
  return layout({
    siteUrl: args.siteUrl,
    locale: args.locale,
    preheader: c.preheader ?? c.heading,
    heading: c.heading,
    bodyHtml,
    bodyText,
    subject: c.subject,
  });
}

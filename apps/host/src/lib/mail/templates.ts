/**
 * Branded transactional emails (docs/brand.md). Table layout and inline styles only, because
 * email clients ignore <style> blocks, most block SVG and none load web fonts: the logo and
 * banners are PNGs rendered from the real brand assets (scripts/render-email-images.mjs) and
 * served from apps/host/public/brand. Every image has alt text for clients that block images.
 * Every dynamic value goes through `esc()`. The only contact address is CONTACT_EMAIL.
 */
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

interface LayoutArgs {
  siteUrl: string;
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

function layout(a: LayoutArgs): Email {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
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
The DevQuake team<br>
<a href="mailto:${CONTACT_EMAIL}" style="color:${INK}">${CONTACT_EMAIL}</a> &middot; <a href="${esc(a.siteUrl)}" style="color:${INK}">${esc(a.siteUrl.replace(/^https?:\/\//, ''))}</a>
</td></tr>
</table></td></tr></table></body></html>`;

  const text = `${a.heading}\n\n${a.bodyText}\n\n--\nThe DevQuake team\n${CONTACT_EMAIL} · ${a.siteUrl}\n`;
  return { subject: a.subject, html, text };
}

function codeBlock(code: string): string {
  return `<p style="margin:20px 0;text-align:center"><span style="display:inline-block;padding:14px 22px;background:${PAPER};border:1px solid #e7e3da;border-radius:8px;font:700 30px/1 'SFMono-Regular',Consolas,monospace;letter-spacing:8px;color:${INK}">${esc(code)}</span></p>`;
}

export interface RequestContext {
  /** e.g. "Cluj-Napoca, Romania" or null */
  location: string | null;
  /** e.g. "Chrome 124 on Windows 10/11" or null */
  device: string | null;
  vpn: string | null;
}

function requestContextHtml(c: RequestContext): { html: string; text: string } {
  const parts = [
    c.location && `Location: ${c.location}`,
    c.device && `Device: ${c.device}`,
    c.vpn && `Network: ${c.vpn}`,
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
}): Email {
  const ctx = requestContextHtml(args.context);
  const where = args.forAdmin ? 'the DevQuake control panel' : 'DevQuake';
  return layout({
    siteUrl: args.siteUrl,
    subject: `${args.code} is your DevQuake sign-in code`,
    preheader: `Your sign-in code expires in ${args.minutes} minutes.`,
    heading: 'Your sign-in code',
    bodyHtml: `<p style="margin:0">Hi ${esc(args.name)},</p>
<p>Enter this code to finish signing in to ${esc(where)}. It expires in ${args.minutes} minutes and works once.</p>
${codeBlock(args.code)}${ctx.html}
<p style="margin:16px 0 0">If you did not try to sign in, someone may know your password: change it and reply to <a href="mailto:${CONTACT_EMAIL}" style="color:${INK}">${CONTACT_EMAIL}</a>. Never share this code with anyone, including us.</p>`,
    bodyText: `Hi ${args.name},\n\nYour code to finish signing in to ${where}: ${args.code}\nIt expires in ${args.minutes} minutes and works once.${ctx.text}\n\nIf you did not try to sign in, change your password and contact ${CONTACT_EMAIL}. Never share this code.`,
  });
}

/** Welcome email after sign-up: the account only becomes active through the link. */
export function welcomeActivationEmail(args: {
  siteUrl: string;
  name: string;
  activationUrl: string;
  hours: number;
}): Email {
  return layout({
    siteUrl: args.siteUrl,
    subject: 'Welcome to DevQuake — activate your account',
    preheader: `Activate your account within ${args.hours} hours to start using DevQuake.`,
    heading: `Hi ${args.name}, welcome aboard!`,
    banner: { src: '/brand/email-welcome.png', alt: 'Welcome to DevQuake' },
    bodyHtml: `<p style="margin:0">Thanks for creating a DevQuake account. DevQuake is a personal, non-commercial workshop of web apps built to solve everyday problems, and you are welcome to use every app that is open.</p>
<p style="margin:16px 0 0">One last step: confirm that this email address is yours by activating your account.</p>
${button(args.activationUrl, 'Activate my account')}
<p style="margin:0;font-size:13px;color:#5b5e66">The link works once and expires in ${args.hours} hours. If the button does not work, copy this address into your browser:<br><a href="${esc(args.activationUrl)}" style="color:${INK};word-break:break-all">${esc(args.activationUrl)}</a></p>
<p style="margin:24px 0 8px"><strong>After activating</strong></p>
<ol style="margin:0;padding-left:20px">
<li style="margin:0 0 6px">You are taken to the sign-in page.</li>
<li style="margin:0 0 6px">Sign in with your email and password; we email you a one-time code each time, so nobody else can use your password.</li>
<li style="margin:0 0 6px">Open <strong>Your account</strong> to see the projects and apps you have access to.</li>
</ol>
<p style="margin:20px 0 0;font-size:13px;color:#5b5e66">Did not sign up? Ignore this email: the account is not activated and will be deleted automatically.</p>`,
    bodyText: `Hi ${args.name}, welcome to DevQuake!

Thanks for creating an account. One last step: activate it by opening this link (it works once and expires in ${args.hours} hours):

${args.activationUrl}

After activating you are taken to the sign-in page. Each sign-in also asks for a one-time code we email you.

Did not sign up? Ignore this email; the account will be deleted automatically.`,
  });
}

export function accountLockedEmail(args: {
  siteUrl: string;
  name: string;
  hours: number;
  context: RequestContext;
}): Email {
  const ctx = requestContextHtml(args.context);
  return layout({
    siteUrl: args.siteUrl,
    subject: 'Your DevQuake account is temporarily locked',
    preheader: `Too many failed sign-in attempts. Locked for ${args.hours} hours.`,
    heading: 'Account temporarily locked',
    bodyHtml: `<p style="margin:0">Hi ${esc(args.name)},</p>
<p>After several failed sign-in attempts in a row we locked your account for <strong>${args.hours} hours</strong> to protect it. You can sign in again after that.</p>${ctx.html}
<p style="margin:16px 0 0">If these attempts were not yours, contact <a href="mailto:${CONTACT_EMAIL}" style="color:${INK}">${CONTACT_EMAIL}</a>.</p>`,
    bodyText: `Hi ${args.name},\n\nAfter several failed sign-in attempts in a row your account is locked for ${args.hours} hours.${ctx.text}\n\nIf these attempts were not yours, contact ${CONTACT_EMAIL}.`,
  });
}

export interface AccountChangeProject {
  name: string;
  role: string;
  url: string | null;
}

export function accountChangedEmail(args: {
  siteUrl: string;
  name: string;
  changes: string[];
  isAdmin: boolean;
  adminUrl: string;
  projects: AccountChangeProject[];
  disabled: boolean;
}): Email {
  const list = args.changes.map((c) => `<li style="margin:0 0 6px">${esc(c)}</li>`).join('');
  const projects = args.projects
    .map(
      (p) =>
        `<li style="margin:0 0 6px"><strong>${esc(p.name)}</strong> (${esc(p.role)})${
          p.url ? ` — <a href="${esc(p.url)}" style="color:${INK}">${esc(p.url)}</a>` : ''
        }</li>`,
    )
    .join('');

  const steps: string[] = [];
  const stepsText: string[] = [];
  if (args.disabled) {
    steps.push('Your account is currently disabled, so you cannot sign in.');
    stepsText.push('Your account is currently disabled, so you cannot sign in.');
  } else {
    steps.push(
      `Sign in at <a href="${esc(args.siteUrl)}/#account" style="color:${INK}">${esc(args.siteUrl.replace(/^https?:\/\//, ''))}</a> with your email and password. We will email you a one-time code to finish signing in.`,
      `Open <strong>Your account</strong> to see your projects and roles.`,
    );
    stepsText.push(
      `Sign in at ${args.siteUrl}/#account with your email and password; we will email you a one-time code.`,
      'Open "Your account" to see your projects and roles.',
    );
    if (args.isAdmin) {
      steps.push(
        `As an administrator you can also sign in to the control panel at <a href="${esc(args.adminUrl)}" style="color:${INK}">${esc(args.adminUrl)}</a>. Keep this address private.`,
      );
      stepsText.push(
        `As an administrator you can sign in to the control panel at ${args.adminUrl}. Keep this address private.`,
      );
    }
  }

  return layout({
    siteUrl: args.siteUrl,
    subject: 'Your DevQuake account was updated',
    preheader: args.changes[0] ?? 'Your account was updated.',
    heading: 'Your account was updated',
    bodyHtml: `<p style="margin:0">Hi ${esc(args.name)},</p>
<p>An administrator made the following changes to your DevQuake account:</p>
<ul style="margin:0 0 16px;padding-left:20px">${list}</ul>
${projects ? `<p style="margin:0 0 8px"><strong>Your projects</strong></p><ul style="margin:0 0 16px;padding-left:20px">${projects}</ul>` : ''}
<p style="margin:0 0 8px"><strong>What to do next</strong></p>
<ol style="margin:0;padding-left:20px">${steps.map((s) => `<li style="margin:0 0 6px">${s}</li>`).join('')}</ol>
${args.disabled ? '' : button(`${args.siteUrl}/account`, 'Open your account')}
<p style="margin:8px 0 0">Questions? Reply to <a href="mailto:${CONTACT_EMAIL}" style="color:${INK}">${CONTACT_EMAIL}</a>.</p>`,
    bodyText: `Hi ${args.name},\n\nAn administrator made these changes to your DevQuake account:\n${args.changes
      .map((c) => `- ${c}`)
      .join('\n')}\n${
      args.projects.length
        ? `\nYour projects:\n${args.projects.map((p) => `- ${p.name} (${p.role})${p.url ? ` ${p.url}` : ''}`).join('\n')}\n`
        : ''
    }\nWhat to do next:\n${stepsText.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nQuestions? ${CONTACT_EMAIL}`,
  });
}

/** Internal notification to contact@devquake.com for a contact-form message. */
export function contactNotificationEmail(args: {
  siteUrl: string;
  adminUrl: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  context: RequestContext;
}): Email {
  const ctx = requestContextHtml(args.context);
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

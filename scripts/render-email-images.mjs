#!/usr/bin/env node
/**
 * Renders the PNG brand images used in emails (most email clients block SVG and web fonts):
 *   apps/host/public/brand/email-logo.png     mark + "devquake" wordmark on Ink, 200x40 @3x
 *   apps/host/public/brand/email-welcome.png  welcome banner, 560x200 @3x
 * Uses the real mark (devquake-mark-inverse.svg) and Bricolage Grotesque from Google Fonts.
 *
 * Needs Microsoft Edge installed and network access for the font. playwright-core is not a
 * project dependency; add it temporarily:
 *   pnpm add -Dw playwright-core && node scripts/render-email-images.mjs && pnpm remove -w playwright-core
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../apps/host/public/brand');
const mark = fs
  .readFileSync(OUT + '/devquake-mark-inverse.svg', 'utf8')
  .replace('<svg ', '<svg class="mark" ');
const base = (w, h, body) => `<!doctype html><html><head>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&display=block" rel="stylesheet">
<style>html,body{margin:0;width:${w}px;height:${h}px;background:#16181D;overflow:hidden}
.word{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;letter-spacing:-0.02em;color:#F4F1EA;line-height:1}
.word span{color:#E4572E}</style></head><body>${body}</body></html>`;

const logo = base(
  200,
  40,
  `<div style="display:flex;align-items:center;gap:10px;height:40px;padding-left:3px">
  <div style="width:34px;height:34px">${mark.replace('class="mark"', 'class="mark" width="34" height="34"')}</div>
  <div class="word" style="font-size:25px">dev<span>quake</span></div></div>`,
);

const hero = base(
  560,
  200,
  `<div style="position:relative;width:560px;height:200px;overflow:hidden">
  <svg width="560" height="200" style="position:absolute;inset:0" viewBox="0 0 560 200">
    <polyline points="0,168 330,168 346,146 362,190 378,134 394,168 560,168" fill="none" stroke="#E4572E" stroke-opacity="0.45" stroke-width="2" stroke-linejoin="round"/>
  </svg>
  <div style="position:absolute;left:36px;top:38px">
    <div class="word" style="font-size:31px">Welcome to dev<span>quake</span></div>
    <div style="margin-top:12px;font:500 15px/1.4 system-ui,sans-serif;color:#F4F1EA;opacity:0.75">A developer’s workshop for everyday problems</div>
  </div></div>`,
);

const b = await chromium.launch({ channel: 'msedge', headless: true });
for (const [name, html, w, h] of [
  ['email-logo', logo, 200, 40],
  ['email-welcome', hero, 560, 200],
]) {
  const p = await (
    await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3 })
  ).newPage();
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  console.log(
    name,
    'font loaded:',
    await p.evaluate(() => document.fonts.check("800 25px 'Bricolage Grotesque'")),
  );
  await p.screenshot({ path: OUT + '/' + name + '.png' });
}
await b.close();

#!/usr/bin/env node
/**
 * Usage: pnpm new:plugin <id> ["Display Name"]
 * Copies templates/plugin into plugins/<id>, fills placeholders, updates the registry
 * and the plugin index in docs/plugins/README.md.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [id, nameArg] = process.argv.slice(2);
const ID_RE = /^[a-z][a-z0-9-]{0,30}[a-z0-9]$/;

if (!id || !ID_RE.test(id)) {
  console.error('Usage: pnpm new:plugin <id> ["Display Name"]  (id: lowercase, digits, dashes)');
  process.exit(1);
}
const name =
  nameArg ??
  id
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
const src = path.join(root, 'templates', 'plugin');
const dest = path.join(root, 'plugins', id);
if (fs.existsSync(dest)) {
  console.error(`plugins/${id} already exists.`);
  process.exit(1);
}

const TEXT = /\.(ts|tsx|js|mjs|json|md|css)$/;
function copy(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name);
    const b = path.join(to, e.name);
    if (e.isDirectory()) copy(a, b);
    else if (TEXT.test(e.name)) {
      const out = fs
        .readFileSync(a, 'utf8')
        .replaceAll('__PLUGIN_ID__', id)
        .replaceAll('__PLUGIN_NAME__', name)
        // Prettier writes `__X__` in Markdown as `**X**`.
        .replaceAll('**PLUGIN_NAME**', name);
      fs.writeFileSync(b, out);
    } else fs.copyFileSync(a, b);
  }
}
copy(src, dest);

// Add the plugin to the "Built" table and remove it from "Planned" if it was listed there.
// Run `pnpm format` afterwards to realign the tables.
const index = path.join(root, 'docs', 'plugins', 'README.md');
if (fs.existsSync(index)) {
  const row = `| \`${id}\` | ${name} | [plugins/${id}](../../plugins/${id}/README.md) | active |`;
  let doc = fs.readFileSync(index, 'utf8');
  doc = doc
    .split('\n')
    .filter((line) => !(line.startsWith(`| \`${id}\``) && line.includes('ideas/')))
    .join('\n');
  const planned = doc.indexOf('\n## Planned');
  doc =
    planned === -1
      ? `${doc.trimEnd()}\n${row}\n`
      : `${doc.slice(0, planned).trimEnd()}\n${row}\n${doc.slice(planned)}`;
  fs.writeFileSync(index, doc);
}

execFileSync(process.execPath, [path.join(root, 'scripts', 'generate-registry.mjs')], {
  stdio: 'inherit',
});

console.log(`
Created plugins/${id}
Next:
  pnpm install
  pnpm dev
  open http://${id}.localhost:3000
`);

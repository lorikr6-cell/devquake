// Entry file of the deploy bundle (copied to .deploy/server.js by scripts/assemble-deploy.mjs).
const fs = require('node:fs');

/**
 * Optional shared settings file for instances the hosting panel does not pass its environment
 * variables to, e.g. app subdomains on Hostinger that start their own copy of the app from a
 * copied .htaccess (docs/guides/deployment.md). Format: KEY=VALUE per line, # for comments,
 * optional quotes. Variables that are already set always win.
 */
function loadEnvFile(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    console.error(`[devquake] could not read DEVQUAKE_ENV_FILE: ${err.message}`);
    return;
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line
      .slice(0, eq)
      .replace(/^export\s+/, '')
      .trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) continue;
    let value = line.slice(eq + 1).trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.endsWith(quote) && value.length > 1) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

if (process.env.DEVQUAKE_ENV_FILE) loadEnvFile(process.env.DEVQUAKE_ENV_FILE);

// Bind on all interfaces unless DEVQUAKE_BIND_HOST is set (some hosts set HOSTNAME to the machine name).
process.env.HOSTNAME = process.env.DEVQUAKE_BIND_HOST || '0.0.0.0';
require('./apps/host/server.js');

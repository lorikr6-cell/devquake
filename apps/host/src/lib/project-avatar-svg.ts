import { Fragment, isValidElement, type ReactNode } from 'react';
import { iconShapes } from '../components/icons';
import type { ProjectAvatarLook } from './project-avatar';

// A project's logo as one standalone SVG document (ADR 0016): the favicon of its app and the
// icon apps show in their toolbar. Same tile, initials and symbol badge as <ProjectAvatar>.

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** strokeWidth → stroke-width; className → class. */
function attributeName(prop: string): string {
  return prop === 'className' ? 'class' : prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/**
 * Serialises simple SVG elements (shapes with plain attributes, fragments, arrays) to markup,
 * without react-dom/server. Anything else (components, functions) is dropped.
 */
export function svgMarkup(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return esc(String(node));
  if (Array.isArray(node)) return node.map(svgMarkup).join('');
  if (!isValidElement(node)) return '';
  const { children, ...props } = node.props as Record<string, unknown> & { children?: ReactNode };
  if (node.type === Fragment) return svgMarkup(children);
  if (typeof node.type !== 'string' || !/^[a-z][a-zA-Z]*$/.test(node.type)) return '';
  const attributes = Object.entries(props)
    .filter(([, v]) => (typeof v === 'string' || typeof v === 'number') && v !== '')
    .map(([k, v]) => ` ${attributeName(k)}="${esc(String(v))}"`)
    .join('');
  return `<${node.type}${attributes}>${svgMarkup(children)}</${node.type}>`;
}

/** The logo as an SVG document, 64 x 64 units (the badge sits inside the square). */
export function projectAvatarSvg(look: ProjectAvatarLook): string {
  const letters = Array.from(look.initials).length;
  const fg = esc(look.foreground);
  const bg = esc(look.background);
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">',
    `<rect x="1" y="1" width="52" height="52" rx="13" fill="${bg}"/>`,
    `<text x="27" y="27" dy="0.36em" text-anchor="middle" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="${letters >= 3 ? 16 : 21}" fill="${fg}">${esc(look.initials)}</text>`,
    `<circle cx="49" cy="49" r="13.5" fill="${bg}" stroke="#ffffff" stroke-width="2.5"/>`,
    `<svg x="40" y="40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${fg}" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">`,
    svgMarkup(iconShapes(look.symbol)),
    '</svg></svg>',
  ].join('');
}

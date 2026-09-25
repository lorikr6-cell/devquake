import { createElement, Fragment } from 'react';
import { describe, expect, it } from 'vitest';
import { projectAvatarLook } from './project-avatar';
import { projectAvatarSvg, svgMarkup } from './project-avatar-svg';

describe('svgMarkup', () => {
  it('writes shapes with kebab-case attributes and escapes values', () => {
    const node = createElement(
      Fragment,
      null,
      createElement('path', { d: 'M1 1"/><script>', strokeWidth: 2 }),
      createElement('circle', { cx: 3, cy: 3, r: 1 }),
    );
    expect(svgMarkup(node)).toBe(
      '<path d="M1 1&quot;/&gt;&lt;script&gt;" stroke-width="2"></path><circle cx="3" cy="3" r="1"></circle>',
    );
  });

  it('drops components and functions', () => {
    const Component = () => null;
    expect(svgMarkup(createElement(Component))).toBe('');
    expect(svgMarkup(createElement('path', { onClick: () => {} }))).toBe('<path></path>');
  });
});

describe('projectAvatarSvg', () => {
  it('draws the initials, colours and symbol of the project', () => {
    const look = projectAvatarLook({
      name: 'Workout tracker',
      pluginId: 'workout',
      color: '#2A62CC',
    });
    const svg = projectAvatarSvg(look);
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toContain('fill="#2A62CC"');
    expect(svg).toContain(`>${look.initials}</text>`);
    expect(svg).toMatch(/<path |<circle |<rect /);
    expect(svg.endsWith('</svg></svg>')).toBe(true);
  });

  it('escapes the initials', () => {
    const look = { ...projectAvatarLook({ name: 'x' }), initials: '<&>' };
    expect(projectAvatarSvg(look)).toContain('>&lt;&amp;&gt;</text>');
  });
});

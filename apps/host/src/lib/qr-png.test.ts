import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { brandedQrLayout, brandedQrSvg } from '@devquake/ui/qr';
import { brandedQrPng } from './qr-png';

// The logo covers part of the code, so check with a real decoder that every size still scans.
const URLS = [
  'https://devquake.com/',
  'https://devquake.com/r/K7MPX2QA',
  'https://shopping.devquake.com/join/RAV5YHWJ',
  `https://shopping.devquake.com/lists/123/share?utm_source=${'x'.repeat(80)}`,
  `https://devquake.com/${'long-path-segment/'.repeat(12)}`,
];

const decode = (buffer: Buffer) => {
  const png = PNG.sync.read(buffer);
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data ?? null;
};

describe('branded QR codes', () => {
  it.each(URLS)('PNG with the logo decodes: %s', (url) => {
    expect(decode(brandedQrPng(url, 480))).toBe(url);
    expect(decode(brandedQrPng(url, 1024))).toBe(url);
  });

  it('clears less than 10% of the modules for the logo, centred', () => {
    for (const url of URLS) {
      const { size, logo } = brandedQrLayout(url, 2);
      const symbol = size - 4;
      expect((logo.size * logo.size) / (symbol * symbol)).toBeLessThan(0.1);
      expect(logo.x * 2 + logo.size).toBe(size);
    }
  });

  it('SVG has the modules, the plate and the mark', () => {
    const svg = brandedQrSvg('https://devquake.com/', { title: 'A <QR>' });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('<title>A &lt;QR&gt;</title>');
    expect(svg).toContain('#E4572E');
  });
});

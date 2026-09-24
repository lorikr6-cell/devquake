import { PNG } from 'pngjs';
import { brandedQrLayout } from '@devquake/ui/qr';
import { MARK_PNG_BASE64 } from './qr-mark.generated';

/**
 * PNG version of the branded QR code (@devquake/ui/qr), for places where SVG does not work:
 * email clients and "Download QR code". Drawn in plain JavaScript (pngjs), no native modules.
 */

const INK = [0x16, 0x18, 0x1d] as const;

let markCache: PNG | null = null;
function mark(): PNG {
  markCache ??= PNG.sync.read(Buffer.from(MARK_PNG_BASE64, 'base64'));
  return markCache;
}

/** Bilinear sample of the mark at (u, v) in 0..1, as premultiplied-free RGBA. */
function sampleMark(u: number, v: number): [number, number, number, number] {
  const src = mark();
  const fx = Math.min(Math.max(u * src.width - 0.5, 0), src.width - 1);
  const fy = Math.min(Math.max(v * src.height - 0.5, 0), src.height - 1);
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(x0 + 1, src.width - 1);
  const y1 = Math.min(y0 + 1, src.height - 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const out: [number, number, number, number] = [0, 0, 0, 0];
  const weights: Array<[number, number, number]> = [
    [x0, y0, (1 - tx) * (1 - ty)],
    [x1, y0, tx * (1 - ty)],
    [x0, y1, (1 - tx) * ty],
    [x1, y1, tx * ty],
  ];
  // Weight colours by alpha so transparent edges do not darken the result.
  let alpha = 0;
  for (const [x, y, w] of weights) {
    const i = (y * src.width + x) * 4;
    const a = (src.data[i + 3]! / 255) * w;
    out[0] += src.data[i]! * a;
    out[1] += src.data[i + 1]! * a;
    out[2] += src.data[i + 2]! * a;
    alpha += a;
  }
  if (alpha > 0) {
    out[0] /= alpha;
    out[1] /= alpha;
    out[2] /= alpha;
  }
  out[3] = alpha;
  return out;
}

/** Branded QR code as a PNG of about `width` pixels (rounded to whole pixels per module). */
export function brandedQrPng(text: string, width: number, margin = 2): Buffer {
  const layout = brandedQrLayout(text, margin);
  const scale = Math.max(1, Math.floor(width / layout.size));
  const px = layout.size * scale;
  const png = new PNG({ width: px, height: px });
  const set = (x: number, y: number, rgb: readonly number[]) => {
    const i = (y * px + x) * 4;
    png.data[i] = rgb[0]!;
    png.data[i + 1] = rgb[1]!;
    png.data[i + 2] = rgb[2]!;
    png.data[i + 3] = 255;
  };

  for (let y = 0; y < px; y++) {
    for (let x = 0; x < px; x++) {
      set(
        x,
        y,
        layout.isDark(Math.floor(x / scale), Math.floor(y / scale)) ? INK : [255, 255, 255],
      );
    }
  }

  // White rounded plate (the cleared square) with the mark inside, 10% padding like the SVG.
  const box = layout.logo.size * scale;
  const left = layout.logo.x * scale;
  const top = layout.logo.y * scale;
  const radius = box * 0.18;
  const pad = box * 0.1;
  const inner = box - pad * 2;
  for (let y = 0; y < box; y++) {
    for (let x = 0; x < box; x++) {
      const cx = Math.max(radius - x, 0, x - (box - 1 - radius));
      const cy = Math.max(radius - y, 0, y - (box - 1 - radius));
      if (cx * cx + cy * cy > radius * radius) continue; // outside the rounded corner
      let rgb: number[] = [255, 255, 255];
      const u = (x + 0.5 - pad) / inner;
      const v = (y + 0.5 - pad) / inner;
      if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
        const [r, g, b, a] = sampleMark(u, v);
        rgb = [r * a + 255 * (1 - a), g * a + 255 * (1 - a), b * a + 255 * (1 - a)].map(Math.round);
      }
      set(left + x, top + y, rgb);
    }
  }
  return PNG.sync.write(png);
}

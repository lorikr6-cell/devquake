import type { CSSProperties, SVGProps } from 'react';
import { cn } from './cn';

// Geometry of the DevQuake mark ("Cracked Q"). Source of truth: docs/brand.md.
const VIEWBOX = '8.5 4.5 108.3 108.3';
const RING_MAIN =
  'M83.47 87.77A42 42 0 1 1 39.49 17.38L36.08 23.05L47.52 26.7L45.38 31.17A27 27 0 1 0 73.66 76.42L72.99 81.33L84.99 81.34L83.47 87.77Z';
const RING_PIECE =
  'M45.24 15.4A42 42 0 0 1 87.77 83.47L88.34 76.88L76.47 78.61L76.42 73.66A27 27 0 0 0 49.08 29.9L51.84 25.79L41.05 20.52L45.24 15.4Z';
const TAIL = 'M84.28 84.28L90.28 78.28L97.28 103.28L103.28 90.28L111.28 90.28';

const QUAKE = 'var(--dq-quake, #E4572E)';

export interface DevQuakeMarkProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** Width and height in px (or any CSS length). */
  size?: number | string;
  /** Single colour: the tail also uses the current text colour. */
  mono?: boolean;
  /** Accessible name. Pass an empty string when the mark is decorative. */
  title?: string;
}

/**
 * The DevQuake mark. The cracked ring follows the current text colour (`currentColor`), so it
 * adapts to light and dark backgrounds; the seismic tail is always Quake orange unless `mono`.
 */
export function DevQuakeMark({
  size = 32,
  mono = false,
  title = 'DevQuake',
  ...props
}: DevQuakeMarkProps) {
  const decorative = title === '';
  return (
    <svg
      viewBox={VIEWBOX}
      width={size}
      height={size}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      {...props}
    >
      {decorative ? null : <title>{title}</title>}
      <path d={RING_MAIN} fill="currentColor" />
      <path d={RING_PIECE} fill="currentColor" />
      <path
        d={TAIL}
        fill="none"
        stroke={mono ? 'currentColor' : QUAKE}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface DevQuakeLogoProps {
  /** Height of the mark in px; the wordmark scales with it. */
  size?: number;
  mono?: boolean;
  className?: string;
}

/** Mark + "devquake" wordmark (Bricolage Grotesque, loaded by the host as --font-brand). */
export function DevQuakeLogo({ size = 32, mono = false, className }: DevQuakeLogoProps) {
  const word: CSSProperties = {
    fontFamily: 'var(--font-brand, system-ui, sans-serif)',
    fontWeight: 800,
    fontSize: size * 0.62,
    letterSpacing: '-0.02em',
    lineHeight: 1,
  };
  return (
    <span className={cn('inline-flex items-center', className)} style={{ gap: size * 0.28 }}>
      <DevQuakeMark size={size} mono={mono} title="" />
      <span style={word} aria-label="DevQuake">
        dev<span style={{ color: mono ? undefined : QUAKE }}>quake</span>
      </span>
    </span>
  );
}

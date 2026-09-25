import type { CSSProperties, ReactNode } from 'react';
import type { HandProp } from '../lib/catalog';
import { BONES, FLOOR, MOTIONS, wrap, type Limb, type Scene } from './motions';

// Every bone is a <g> rotated about its joint; the child bone sits at the parent's end. Each
// group gets its transform for pose A (--a) and pose B (--b), and one shared keyframe swings
// between them. Works in every current browser (no CSS path animation, which Safari lacks), and
// stands still for people who turned on reduced motion.
const CSS = `.wo-fig g{transform-box:view-box;transform-origin:0 0}
.wo-fig .wo-m{transform:var(--a)}
.wo-fig.wo-anim .wo-m{animation:wo-move var(--wo-d) ease-in-out infinite alternate}
@keyframes wo-move{from{transform:var(--a)}to{transform:var(--b)}}
@media (prefers-reduced-motion:reduce){.wo-fig .wo-m{animation:none!important}}`;

const { torso: T, upperArm: UA, forearm: FA, thigh: TH, shin: SH, head: HEAD } = BONES;

/** Rotation relative to the parent bone, and pose B's turned the short way from pose A's. */
function angles(a: number, b: number): [number, number] {
  const ra = wrap(a);
  return [ra, ra + wrap(wrap(b) - ra)];
}

function Bone({ from, to, children }: { from: string; to: string; children: ReactNode }) {
  const style = { '--a': from, '--b': to } as CSSProperties;
  return (
    <g className="wo-m" style={style}>
      {children}
    </g>
  );
}

const rot = (deg: number) => `rotate(${deg.toFixed(1)}deg)`;
const move = (x: number, y: number) => `translate(${x}px, ${y}px)`;

function HandProp({ prop }: { prop: HandProp }) {
  if (prop === 'dumbbell') {
    return (
      <g transform={`translate(${FA},0)`} className="text-quake">
        <line x1={0} y1={-4} x2={0} y2={4} strokeWidth={1.6} />
        <rect x={-2} y={-6.5} width={4} height={3} fill="currentColor" stroke="none" rx={0.6} />
        <rect x={-2} y={3.5} width={4} height={3} fill="currentColor" stroke="none" rx={0.6} />
      </g>
    );
  }
  if (prop === 'kettlebell') {
    return (
      <g transform={`translate(${FA + 3.5},0)`} className="text-quake">
        <circle r={3.4} fill="currentColor" stroke="none" />
      </g>
    );
  }
  return (
    <g transform={`translate(${FA},0)`} className="text-quake">
      <circle r={5} fill="none" strokeWidth={1.6} />
      <circle r={1.2} fill="currentColor" stroke="none" />
    </g>
  );
}

function Arm({
  a,
  b,
  torso,
  offset,
  prop,
  far,
}: {
  a: Limb;
  b: Limb;
  torso: [number, number];
  offset: number;
  prop: HandProp | null;
  far: boolean;
}) {
  const [ua, ub] = angles(a[0] - torso[0], b[0] - torso[1]);
  const [fa, fb] = angles(a[1] - a[0], b[1] - b[0]);
  return (
    <Bone from={`${move(T, offset)} ${rot(ua)}`} to={`${move(T, offset)} ${rot(ub)}`}>
      <g opacity={far ? 0.4 : 1}>
        <line x2={UA} />
        <Bone from={`${move(UA, 0)} ${rot(fa)}`} to={`${move(UA, 0)} ${rot(fb)}`}>
          <line x2={FA} />
          {prop && (!far || prop !== 'barbell') ? <HandProp prop={prop} /> : null}
        </Bone>
      </g>
    </Bone>
  );
}

function Leg({ a, b, offset, far }: { a: Limb; b: Limb; offset: number; far: boolean }) {
  const [ta, tb] = angles(a[0], b[0]);
  const [sa, sb] = angles(a[1] - a[0], b[1] - b[0]);
  return (
    <Bone from={`${move(offset, 0)} ${rot(ta)}`} to={`${move(offset, 0)} ${rot(tb)}`}>
      <g opacity={far ? 0.4 : 1}>
        <line x2={TH} />
        <Bone from={`${move(TH, 0)} ${rot(sa)}`} to={`${move(TH, 0)} ${rot(sb)}`}>
          <line x2={SH} />
        </Bone>
      </g>
    </Bone>
  );
}

function SceneShape({ scene }: { scene: Scene }) {
  switch (scene.kind) {
    case 'bench':
      return (
        <g>
          <rect x={scene.x} y={scene.y} width={scene.w} height={3} rx={1} />
          <line x1={scene.x + 4} y1={scene.y + 3} x2={scene.x + 4} y2={FLOOR} />
          <line x1={scene.x + scene.w - 4} y1={scene.y + 3} x2={scene.x + scene.w - 4} y2={FLOOR} />
        </g>
      );
    case 'box':
      return <rect x={scene.x} y={scene.y} width={scene.w} height={FLOOR - scene.y} rx={1} />;
    case 'wall':
      return <line x1={scene.x} y1={18} x2={scene.x} y2={FLOOR} />;
    case 'bar':
      return (
        <g>
          <line x1={16} y1={scene.y} x2={84} y2={scene.y} strokeWidth={2} />
          <line x1={18} y1={scene.y} x2={18} y2={FLOOR} />
          <line x1={82} y1={scene.y} x2={82} y2={FLOOR} />
        </g>
      );
    case 'seat':
      return (
        <g>
          <rect x={scene.x - 9} y={scene.y} width={18} height={3} rx={1} />
          <line x1={scene.x} y1={scene.y + 3} x2={scene.x} y2={FLOOR} />
        </g>
      );
    case 'cable':
      return (
        <g>
          <rect x={scene.x - 3} y={12} width={6} height={FLOOR - 12} rx={1} />
          <circle cx={scene.x - 3} cy={36} r={2} />
        </g>
      );
    case 'bike':
      return (
        <g>
          <line x1={33} y1={57} x2={45} y2={57} strokeWidth={2} />
          <line x1={40} y1={58} x2={55} y2={80} />
          <circle cx={55} cy={80} r={7} />
          <line x1={55} y1={80} x2={70} y2={52} />
          <line x1={68} y1={50} x2={77} y2={50} strokeWidth={2} />
          <line x1={30} y1={FLOOR} x2={80} y2={FLOOR} strokeWidth={2} />
        </g>
      );
    case 'rower':
      return (
        <g>
          <line x1={20} y1={89} x2={92} y2={89} strokeWidth={2} />
          <line x1={80} y1={80} x2={84} y2={FLOOR} />
          <circle cx={90} cy={78} r={5} />
        </g>
      );
    case 'sled':
      return (
        <g>
          <line x1={30} y1={FLOOR} x2={90} y2={34} />
          <rect x={30} y={75} width={20} height={3} rx={1} />
        </g>
      );
    case 'treadmill':
      return (
        <g>
          <rect x={12} y={FLOOR} width={74} height={3} rx={1.5} />
          <line x1={82} y1={FLOOR} x2={88} y2={50} />
          <line x1={88} y1={50} x2={78} y2={50} strokeWidth={2} />
        </g>
      );
  }
}

export interface StickFigureProps {
  /** A key of MOTIONS. */
  motion: string;
  prop?: HandProp | null;
  /** Extra scenery, e.g. from equipmentScenes(). */
  scenes?: Scene[];
  /** Show pose A without moving (lists, thumbnails). */
  still?: boolean;
  className?: string;
  /** Accessible name; without it the figure is decorative. */
  title?: string;
}

/** An exercise as an animated stick figure (ADR 0013). Draws in currentColor. */
export function StickFigure({
  motion,
  prop = null,
  scenes = [],
  still = false,
  className,
  title,
}: StickFigureProps) {
  const m = MOTIONS[motion];
  if (!m) return null;
  const { a, b } = m;
  const torso = angles(a.torso, b.torso);
  const armOffset = m.front ? 6 : 0;
  const legOffset = m.front ? 4 : 0;
  const [pa, pb] = [a, b];
  const style = { '--wo-d': `${m.seconds}s` } as CSSProperties;

  return (
    <svg
      viewBox="0 0 100 100"
      className={['wo-fig', still ? '' : 'wo-anim', className].filter(Boolean).join(' ')}
      style={style}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <g opacity={0.35} strokeWidth={1.4}>
        <line x1={4} y1={FLOOR} x2={96} y2={FLOOR} />
        {[...(m.scene ?? []), ...scenes].map((scene, i) => (
          <SceneShape key={i} scene={scene} />
        ))}
      </g>
      <g strokeWidth={3.2}>
        <Bone from={move(pa.x, pa.y)} to={move(pb.x, pb.y)}>
          <Leg a={pa.farLeg} b={pb.farLeg} offset={-legOffset} far={!m.front} />
          <Bone from={rot(torso[0])} to={rot(torso[1])}>
            <Arm
              a={pa.farArm}
              b={pb.farArm}
              torso={torso}
              offset={-armOffset}
              prop={prop}
              far={!m.front}
            />
            <line x2={T} />
            <circle cx={T + HEAD + 1.5} r={HEAD} fill="currentColor" stroke="none" />
            <Arm
              a={pa.nearArm}
              b={pb.nearArm}
              torso={torso}
              offset={armOffset}
              prop={prop}
              far={false}
            />
          </Bone>
          <Leg a={pa.nearLeg} b={pb.nearLeg} offset={legOffset} far={false} />
        </Bone>
      </g>
    </svg>
  );
}

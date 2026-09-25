/**
 * Stick-figure animations (ADR 0013). A figure is a skeleton of straight bones on a 100 × 100
 * grid, floor at y = 92, facing right. A pose gives the pelvis position and the ABSOLUTE angle
 * of every bone in degrees (0 = pointing right, 90 = down, -90 = up, 180 = left). A motion
 * swings between two poses; StickFigure turns the angles into nested SVG groups rotated by CSS,
 * so the browser animates it without JavaScript.
 *
 * `near` limbs are drawn solid, `far` limbs faded. `front: true` shows the figure from the
 * front: arms and legs are spread to the sides instead of overlapping.
 */

export const BONES = { torso: 24, upperArm: 13, forearm: 12, thigh: 17, shin: 17, head: 5.5 };
export const FLOOR = 92;

/** [upper bone, lower bone]: upper arm + forearm, or thigh + shin. */
export type Limb = readonly [number, number];

export interface Pose {
  x: number;
  y: number;
  torso: number;
  nearArm: Limb;
  farArm: Limb;
  nearLeg: Limb;
  farLeg: Limb;
}

export type Scene =
  | { kind: 'bench'; x: number; w: number; y: number }
  | { kind: 'box'; x: number; w: number; y: number }
  | { kind: 'wall'; x: number }
  | { kind: 'bar'; y: number }
  | { kind: 'seat'; x: number; y: number }
  | { kind: 'cable'; x: number }
  | { kind: 'bike' }
  | { kind: 'rower' }
  | { kind: 'sled' }
  | { kind: 'treadmill' };

export interface Motion {
  a: Pose;
  b: Pose;
  /** Seconds from one pose to the other. */
  seconds: number;
  front?: boolean;
  scene?: Scene[];
}

const STAND: Pose = {
  x: 50,
  y: 58,
  torso: -90,
  nearArm: [90, 90],
  farArm: [90, 90],
  nearLeg: [90, 90],
  farLeg: [90, 90],
};

const pose = (p: Partial<Pose>, base: Pose = STAND): Pose => ({ ...base, ...p });
/** The same angles for both arms / both legs. */
const arms = (l: Limb) => ({ nearArm: l, farArm: l });
const legs = (l: Limb) => ({ nearLeg: l, farLeg: l });

const SQUAT_LOW = pose({ x: 38, y: 73, torso: -60, ...arms([0, 0]), ...legs([15, 105]) });
const HIGH_PLANK = pose({ x: 40, y: 81, torso: -23, ...arms([85, 95]), ...legs([157, 157]) });
const HINGE_LOW = pose({ x: 44, y: 59, torso: -12, ...legs([100, 80]) });
const LYING = pose({ x: 58, y: 90, torso: 180, ...arms([0, 0]), ...legs([-45, 70]) });
const ON_BENCH = pose({ x: 58, y: 71, torso: 180, ...arms([-90, -90]), ...legs([25, 100]) });
const HANG = pose({ x: 50, y: 59, torso: -90, ...arms([-90, -90]), ...legs([100, 130]) });
const SEATED = pose({ x: 44, y: 72, torso: -92, ...arms([95, 90]), ...legs([0, 90]) });
const BENCH: Scene = { kind: 'bench', x: 20, w: 52, y: 74 };
const SEAT: Scene = { kind: 'seat', x: 44, y: 74 };

export const MOTIONS: Record<string, Motion> = {
  // Warm-ups
  march: {
    a: pose({ nearLeg: [30, 100], nearArm: [115, 100], farArm: [60, 20] }),
    b: pose({ farLeg: [30, 100], farArm: [115, 100], nearArm: [60, 20] }),
    seconds: 0.6,
  },
  high_knees: {
    a: pose({ nearLeg: [-5, 95], nearArm: [120, 60], farArm: [70, -30] }),
    b: pose({ farLeg: [-5, 95], farArm: [120, 60], nearArm: [70, -30] }),
    seconds: 0.35,
  },
  jumping_jack: {
    a: pose({ farArm: [100, 100], nearArm: [80, 80], farLeg: [95, 95], nearLeg: [85, 85] }),
    b: pose({
      y: 60,
      farArm: [-130, -120],
      nearArm: [-50, -60],
      farLeg: [110, 110],
      nearLeg: [70, 70],
    }),
    seconds: 0.4,
    front: true,
  },
  arm_circles: {
    a: pose({ farArm: [165, 165], nearArm: [15, 15] }),
    b: pose({ farArm: [205, 205], nearArm: [-25, -25] }),
    seconds: 0.45,
    front: true,
  },
  hip_circles: {
    a: pose({ x: 46, torso: -96, farArm: [120, 30], nearArm: [60, 150] }),
    b: pose({ x: 54, torso: -84, farArm: [120, 30], nearArm: [60, 150] }),
    seconds: 1,
    front: true,
  },
  torso_twist: {
    a: pose({ torso: -96, farArm: [185, 180], nearArm: [175, 180] }),
    b: pose({ torso: -84, farArm: [5, 0], nearArm: [-5, 0] }),
    seconds: 0.9,
    front: true,
  },
  leg_swing: {
    a: pose({ nearLeg: [25, 35], nearArm: [5, 5] }),
    b: pose({ nearLeg: [130, 120], nearArm: [5, 5] }),
    seconds: 0.8,
    scene: [{ kind: 'wall', x: 76 }],
  },

  // Walking and running
  walk: {
    a: pose({
      y: 60,
      torso: -88,
      nearLeg: [65, 95],
      farLeg: [115, 100],
      nearArm: [110, 95],
      farArm: [70, 50],
    }),
    b: pose({
      y: 60,
      torso: -88,
      farLeg: [65, 95],
      nearLeg: [115, 100],
      farArm: [110, 95],
      nearArm: [70, 50],
    }),
    seconds: 0.55,
  },
  jog: {
    a: pose({
      y: 63,
      torso: -82,
      nearLeg: [45, 110],
      farLeg: [120, 150],
      nearArm: [120, 40],
      farArm: [60, -20],
    }),
    b: pose({
      y: 63,
      torso: -82,
      farLeg: [45, 110],
      nearLeg: [120, 150],
      farArm: [120, 40],
      nearArm: [60, -20],
    }),
    seconds: 0.4,
  },
  run: {
    a: pose({
      y: 64,
      torso: -75,
      nearLeg: [30, 115],
      farLeg: [125, 170],
      nearArm: [130, 50],
      farArm: [40, -40],
    }),
    b: pose({
      y: 64,
      torso: -75,
      farLeg: [30, 115],
      nearLeg: [125, 170],
      farArm: [130, 50],
      nearArm: [40, -40],
    }),
    seconds: 0.32,
  },
  jump_rope: {
    a: pose({ nearArm: [80, 20], farArm: [100, 160] }),
    b: pose({ y: 53, nearArm: [80, 20], farArm: [100, 160], ...legs([95, 80]) }),
    seconds: 0.35,
    front: true,
  },

  // Body weight
  push_up: {
    a: HIGH_PLANK,
    b: pose({ y: 89, torso: -8, ...arms([-150, 60]), ...legs([172, 172]) }, HIGH_PLANK),
    seconds: 1.2,
  },
  knee_push_up: {
    a: pose({ x: 45, y: 85, torso: -30, ...arms([80, 95]), ...legs([150, -170]) }),
    b: pose({ x: 45, y: 89, torso: -12, ...arms([-150, 60]), ...legs([168, -168]) }),
    seconds: 1.2,
  },
  wall_push_up: {
    a: pose({ x: 42, torso: -70, ...arms([0, 0]), nearLeg: [105, 95], farLeg: [100, 100] }),
    b: pose({ x: 44, torso: -58, ...arms([60, -30]), nearLeg: [110, 98], farLeg: [104, 102] }),
    seconds: 1.1,
    scene: [{ kind: 'wall', x: 75 }],
  },
  incline_push_up: {
    a: pose({ x: 36, y: 70, torso: -40, ...arms([50, 70]), ...legs([140, 140]) }),
    b: pose({ x: 36, y: 75, torso: -28, ...arms([-150, 60]), ...legs([150, 150]) }),
    seconds: 1.2,
    scene: [{ kind: 'bench', x: 58, w: 30, y: 72 }],
  },
  pike_push_up: {
    a: pose({ x: 46, y: 60, torso: 60, ...arms([75, 95]), ...legs([110, 110]) }),
    b: pose({ x: 46, y: 60, torso: 70, ...arms([-170, 110]), ...legs([110, 110]) }),
    seconds: 1.3,
  },
  squat: { a: STAND, b: SQUAT_LOW, seconds: 1.2 },
  jump_squat: {
    a: pose({ y: 53, ...arms([-100, -95]) }),
    b: pose({ ...arms([130, 120]) }, SQUAT_LOW),
    seconds: 0.6,
  },
  goblet_squat: {
    a: pose({ ...arms([70, -100]) }),
    b: pose({ torso: -65, ...arms([95, -75]) }, SQUAT_LOW),
    seconds: 1.2,
  },
  back_squat: {
    a: pose({ ...arms([140, -60]) }),
    b: pose({ torso: -55, ...arms([175, -25]) }, SQUAT_LOW),
    seconds: 1.3,
  },
  lunge: {
    a: STAND,
    b: pose({ y: 71, nearLeg: [20, 95], farLeg: [110, 170] }),
    seconds: 1.3,
  },
  step_up: {
    a: pose({ x: 46, nearLeg: [20, 120] }),
    b: pose({ x: 62, y: 42, torso: -88, farLeg: [100, 110] }),
    seconds: 1.3,
    scene: [{ kind: 'box', x: 52, w: 26, y: 76 }],
  },
  bridge: {
    a: LYING,
    b: pose({ y: 78, torso: 165, ...arms([-15, -15]), ...legs([-10, 80]) }, LYING),
    seconds: 1.2,
  },
  wall_sit: {
    a: pose({ x: 38, y: 75, ...arms([60, 20]), ...legs([0, 90]) }),
    b: pose({ x: 38, y: 75.6, ...arms([62, 20]), ...legs([0, 90]) }),
    seconds: 2,
    scene: [{ kind: 'wall', x: 34 }],
  },
  calf_raise: { a: STAND, b: pose({ y: 54 }), seconds: 0.8 },
  burpee: {
    a: pose({ y: 54, farArm: [-100, -95], nearArm: [-80, -85] }),
    b: HIGH_PLANK,
    seconds: 0.9,
  },
  mountain_climber: {
    a: pose({ nearLeg: [10, 150] }, HIGH_PLANK),
    b: pose({ farLeg: [10, 150] }, HIGH_PLANK),
    seconds: 0.35,
  },
  superman: {
    a: pose({ x: 45, y: 88, torso: 0, ...arms([0, 0]), ...legs([180, 180]) }),
    b: pose({ x: 45, y: 88, torso: -12, ...arms([-22, -22]), ...legs([192, 192]) }),
    seconds: 1.2,
  },
  snow_angel: {
    a: pose({ x: 45, y: 88, torso: 0, ...arms([100, 180]), ...legs([180, 180]) }),
    b: pose({ x: 45, y: 88, torso: -6, ...arms([-8, -8]), ...legs([180, 180]) }),
    seconds: 1.4,
  },
  bench_dip: {
    a: pose({ x: 48, y: 62, ...arms([100, 95]), ...legs([30, 75]) }),
    b: pose({ x: 48, y: 74, ...arms([150, 60]), ...legs([10, 80]) }),
    seconds: 1.2,
    scene: [{ kind: 'bench', x: 22, w: 22, y: 66 }],
  },

  // Core
  plank: {
    a: pose({ x: 38, y: 83, torso: -15, ...arms([90, 0]), ...legs([165, 165]) }),
    b: pose({ x: 38, y: 82, torso: -16, ...arms([90, 0]), ...legs([164, 164]) }),
    seconds: 2,
  },
  side_plank: {
    a: pose({
      x: 38,
      y: 81,
      torso: -20,
      nearArm: [90, 0],
      farArm: [-90, -90],
      ...legs([160, 160]),
    }),
    b: pose({
      x: 38,
      y: 77,
      torso: -26,
      nearArm: [95, 0],
      farArm: [-95, -95],
      ...legs([154, 154]),
    }),
    seconds: 1.6,
  },
  crunch: {
    a: pose({ ...arms([-120, 10]) }, LYING),
    b: pose({ torso: -150, ...arms([-95, 40]) }, LYING),
    seconds: 1,
  },
  bicycle_crunch: {
    a: pose({ torso: -155, ...arms([-100, 40]), nearLeg: [-60, 20], farLeg: [-15, -10] }, LYING),
    b: pose({ torso: -155, ...arms([-100, 40]), farLeg: [-60, 20], nearLeg: [-15, -10] }, LYING),
    seconds: 0.7,
  },
  leg_raise: {
    a: pose({ x: 50, ...legs([-4, -4]) }, LYING),
    b: pose({ x: 50, ...legs([-85, -85]) }, LYING),
    seconds: 1.3,
  },
  dead_bug: {
    a: pose({ ...arms([-90, -90]), ...legs([-90, 0]) }, LYING),
    b: pose(
      { farArm: [-90, -90], nearArm: [-165, -165], farLeg: [-90, 0], nearLeg: [-20, -20] },
      LYING,
    ),
    seconds: 1.2,
  },
  russian_twist: {
    a: pose({ x: 50, y: 88, torso: -115, ...arms([10, -10]), ...legs([-35, 30]) }),
    b: pose({ x: 50, y: 88, torso: -110, ...arms([70, 95]), ...legs([-35, 30]) }),
    seconds: 0.7,
  },
  hanging_knee_raise: {
    a: pose({ ...legs([95, 100]) }, HANG),
    b: pose({ ...legs([-5, 90]) }, HANG),
    seconds: 1.2,
    scene: [{ kind: 'bar', y: 10 }],
  },
  pull_up: {
    a: HANG,
    b: pose({ y: 45, ...arms([-150, -30]) }, HANG),
    seconds: 1.4,
    scene: [{ kind: 'bar', y: 10 }],
  },

  // Free weights
  bench_press: {
    a: ON_BENCH,
    b: pose({ ...arms([125, -85]) }, ON_BENCH),
    seconds: 1.2,
    scene: [BENCH],
  },
  fly: {
    a: ON_BENCH,
    b: pose({ ...arms([175, -140]) }, ON_BENCH),
    seconds: 1.4,
    scene: [BENCH],
  },
  floor_press: {
    a: pose({ ...arms([-90, -90]) }, LYING),
    b: pose({ ...arms([165, -90]) }, LYING),
    seconds: 1.2,
  },
  overhead_press: {
    a: pose({ ...arms([70, -100]) }),
    b: pose({ ...arms([-88, -90]) }),
    seconds: 1.2,
  },
  lateral_raise: {
    a: pose({ farArm: [100, 95], nearArm: [80, 85] }),
    b: pose({ farArm: [180, 175], nearArm: [0, 5] }),
    seconds: 1.2,
    front: true,
  },
  row: {
    a: HINGE_LOW,
    b: pose({ ...arms([-170, 90]) }, HINGE_LOW),
    seconds: 1.2,
  },
  curl: { a: STAND, b: pose({ ...arms([95, -60]) }), seconds: 1.2 },
  overhead_triceps: {
    a: pose({ ...arms([-95, 100]) }),
    b: pose({ ...arms([-95, -92]) }),
    seconds: 1.2,
  },
  hinge: { a: STAND, b: HINGE_LOW, seconds: 1.4 },
  kb_swing: {
    a: pose({ ...arms([120, 125]) }, HINGE_LOW),
    b: pose({ ...arms([0, -5]) }),
    seconds: 0.8,
  },
  pull_apart: {
    a: pose({ farArm: [30, -30], nearArm: [150, 210] }),
    b: pose({ farArm: [180, 180], nearArm: [0, 0] }),
    seconds: 1.1,
    front: true,
  },
  press_forward: {
    a: pose({ ...arms([150, 0]) }),
    b: pose({ ...arms([5, 0]) }),
    seconds: 1.1,
  },

  // Machines
  seated_row: {
    a: pose({ x: 40, y: 88, torso: -90, ...arms([5, 0]), ...legs([5, 5]) }),
    b: pose({ x: 40, y: 88, torso: -95, ...arms([160, 5]), ...legs([5, 5]) }),
    seconds: 1.2,
    scene: [{ kind: 'cable', x: 84 }],
  },
  seated_press: {
    a: pose({ ...arms([150, 0]) }, SEATED),
    b: pose({ ...arms([5, 0]) }, SEATED),
    seconds: 1.2,
    scene: [SEAT],
  },
  lat_pulldown: {
    a: pose({ ...arms([-95, -90]) }, SEATED),
    b: pose({ ...arms([110, -80]) }, SEATED),
    seconds: 1.3,
    scene: [SEAT, { kind: 'bar', y: 20 }],
  },
  pushdown: {
    a: pose({ ...arms([95, -10]) }),
    b: pose({ ...arms([95, 80]) }),
    seconds: 1.1,
    scene: [{ kind: 'cable', x: 72 }],
  },
  face_pull: {
    a: pose({ ...arms([-10, -10]) }),
    b: pose({ ...arms([-170, -30]) }),
    seconds: 1.2,
    scene: [{ kind: 'cable', x: 84 }],
  },
  leg_press: {
    a: pose({ x: 40, y: 72, torso: -140, ...arms([100, 30]), ...legs([-60, 50]) }),
    b: pose({ x: 40, y: 72, torso: -140, ...arms([100, 30]), ...legs([-40, -40]) }),
    seconds: 1.3,
    scene: [{ kind: 'sled' }],
  },
  leg_curl: {
    a: pose({ x: 45, y: 70, torso: 0, ...arms([90, 20]), ...legs([180, 180]) }),
    b: pose({ x: 45, y: 70, torso: 0, ...arms([90, 20]), ...legs([180, -60]) }),
    seconds: 1.2,
    scene: [{ kind: 'bench', x: 20, w: 52, y: 73 }],
  },
  leg_extension: {
    a: SEATED,
    b: pose({ ...legs([0, 5]) }, SEATED),
    seconds: 1.2,
    scene: [SEAT],
  },
  cycle: {
    a: pose({ x: 40, y: 55, torso: -55, ...arms([45, 30]), nearLeg: [20, 110], farLeg: [60, 120] }),
    b: pose({ x: 40, y: 55, torso: -55, ...arms([45, 30]), farLeg: [20, 110], nearLeg: [60, 120] }),
    seconds: 0.5,
    scene: [{ kind: 'bike' }],
  },
  rowing: {
    a: pose({ x: 58, y: 86, torso: -60, ...arms([20, 5]), ...legs([-40, 55]) }),
    b: pose({ x: 40, y: 86, torso: -110, ...arms([140, -10]), ...legs([0, 5]) }),
    seconds: 1.2,
    scene: [{ kind: 'rower' }],
  },
};

/** Scenes that come from an exercise's equipment rather than from its motion. */
export function equipmentScenes(equipment: readonly string[]): Scene[] {
  return equipment.includes('treadmill') ? [{ kind: 'treadmill' }] : [];
}

/** a's relative angle to b, turned the short way round (-180, 180]. */
export function wrap(deg: number): number {
  const d = ((deg % 360) + 360) % 360;
  return d > 180 ? d - 360 : d;
}

// The window shell: frame archetype, pane layout, open state, sill. The shell
// is a pure function of the window seed — it rolls on its own fork so shell
// and DNA vocabularies grow without re-randomizing each other (see the
// determinism chapter). Roll order lives in archetypes.ts.
//
// This module is the shell's vocabulary: the catalogue rolls, and the
// unit-measure geometry helpers the drawers share. Assembly — collecting the
// drawers' marks and drawing the window — lives in this folder's index.
import { fork } from '@/core/randomness/rng';
import type { Pt3 } from '@/motion/projection';
import type { Mark } from '@/core/scene';
import { ADDONS, ARCHETYPES, OPEN_STATES, SIDES, SILLS, type ShellPlan } from './archetypes';

// The archetype roll table, hoisted: building it per call allocated for no
// reason, and Object.entries order is stable, so the roll sequence never
// shifts.
const ARCHETYPE_ROLLS = Object.entries(ARCHETYPES).map(([value, a]) => ({
  value,
  weight: a.weight,
}));

export function expandShell(seed: number): ShellPlan {
  const rng = fork(seed, 'shell');
  const archetypeId = rng.weighted(ARCHETYPE_ROLLS) as keyof typeof ARCHETYPES;

  // Each branch rolls its plan in the documented order; the object literals
  // evaluate in source order, so the roll sequence stays a pure function of
  // the seed whatever the archetype.
  const jitter = () => rng.float(JITTER_RANGE.min, JITTER_RANGE.max);
  const face = () => rng.float(FACE_WIDTH_RANGE.min, FACE_WIDTH_RANGE.max);
  const masses = () => {
    const shutters = rng.weighted(ADDONS.shutters);
    return {
      shutters: archetypeId === 'sliding' ? shutters : ('none' as const),
      sill: rng.weighted(SILLS),
      awning: rng.weighted(ADDONS.awning),
      box: rng.weighted(ADDONS.box),
    };
  };

  if (archetypeId === 'sliding') {
    const layout = rng.weighted(ARCHETYPES[archetypeId].layouts);
    return {
      archetype: archetypeId,
      layout,
      open: rng.weighted(OPEN_STATES),
      slideSide: rng.weighted(SIDES),
      thicknessJitter: jitter(),
      faceWidth: face(),
      ...masses(),
    };
  }
  if (archetypeId === 'casement') {
    const layout = rng.weighted(ARCHETYPES[archetypeId].layouts);
    return {
      archetype: archetypeId,
      layout,
      open: rng.weighted(OPEN_STATES),
      thicknessJitter: jitter(),
      faceWidth: face(),
      ...masses(),
    };
  }
  return {
    archetype: 'picture',
    layout: rng.weighted(ARCHETYPES.picture.layouts),
    thicknessJitter: jitter(),
    faceWidth: face(),
    ...masses(),
  };
}

// The measured rolls' ranges: the frame thickness jitters within ±15% of its
// archetype constant; the face width — the run between the frame's outer and
// inner lines — rolls in this band.
const JITTER_RANGE = { min: 0.85, max: 1.15 } as const;
const FACE_WIDTH_RANGE = { min: 0.03, max: 0.06 } as const;

export const BOX = { halfW: 0.8, halfH: 0.5 };

// Sort keys for the shell's marks, spaced so later layers interleave. The
// awning sorts above the shutters — the roof stands over them. Sort
// keys only: a unit-measure depth stays under ~1.2 (a swung casement leaf),
// and one of these values fed to the projection would flip the geometry
// through the origin.
export const SHELL_Z = {
  backing: -10,
  glass: 0,
  frame: 10,
  sill: 20,
  open: 30,
  shutter: 40,
  awning: 50,
  box: 60,
} as const;

export interface PaneRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export function innerRect(face: number): PaneRect {
  return {
    top: -BOX.halfH + face,
    bottom: BOX.halfH - face,
    left: -BOX.halfW + face,
    right: BOX.halfW - face,
  };
}

// Geometry helpers in unit measure. Points always lie where the geometry says
// — a SHELL_Z sort key must never reach them.
export function rectPts(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  depthAt: (x: number) => number = () => 0,
): Pt3[] {
  return [
    { x: x0, y: y0, z: depthAt(x0) },
    { x: x1, y: y0, z: depthAt(x1) },
    { x: x1, y: y1, z: depthAt(x1) },
    { x: x0, y: y1, z: depthAt(x0) },
  ];
}

export function line(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  depthAt: (x: number) => number = () => 0,
): Pt3[] {
  return [
    { x: x0, y: y0, z: depthAt(x0) },
    { x: x1, y: y1, z: depthAt(x1) },
  ];
}

// A swung plane (an opened casement leaf, a shutter panel): x foreshortens by
// the swing's cosine, and depth grows with distance from the hinge at the
// swing's tangent. The angle belongs to the caller — the casement rolls it
// per open state, the shutters hold one fixed.
export function swingFreeX(hingeX: number, farX: number, angle: number): number {
  return hingeX + (farX - hingeX) * Math.cos(angle);
}

export function swingDepthAt(hingeX: number, angle: number): (x: number) => number {
  return (x: number) => Math.abs(x - hingeX) * Math.tan(angle);
}

// A pane's border strokes, named `${trace}-top|bottom|left|right`. Every pane
// draws all four regardlessly, even where they ride on the outer mullion —
// the doubled edge is the hand-set look. Edges draw at the frame weight
// (`outerW`); a vertical shared with a neighbouring pane — an inner splitter
// — passes its own catalogue weight through `leftW`/`rightW`. `depthAt`
// stands the pane out of the wall.
export function paneEdges(
  rect: PaneRect,
  trace: string,
  z: number,
  outerW: number,
  opts: {
    leftW?: number;
    rightW?: number;
    depthAt?: (x: number) => number;
  } = {},
): Mark[] {
  const { top, bottom, left, right } = rect;
  const { leftW = outerW, rightW = outerW, depthAt = () => 0 } = opts;
  const edge = (name: string, x0: number, y0: number, x1: number, y1: number, width: number): Mark => ({
    kind: 'stroke',
    pts: line(x0, y0, x1, y1, depthAt),
    name,
    widthUnits: width,
    role: 'ink',
    z,
  });
  return [
    edge(`${trace}-top`, left, top, right, top, outerW),
    edge(`${trace}-bottom`, left, bottom, right, bottom, outerW),
    edge(`${trace}-left`, left, top, left, bottom, leftW),
    edge(`${trace}-right`, right, top, right, bottom, rightW),
  ];
}

// A pane: the glass wash plus its four border strokes — the invariant is one
// mechanism, not a pair every drawer re-types.
export function paneMarks(
  rect: PaneRect,
  trace: string,
  outerW: number,
  opts: {
    leftW?: number;
    rightW?: number;
    depthAt?: (x: number) => number;
  } = {},
): Mark[] {
  return [
    { kind: 'fill', pts: rectPts(rect.left, rect.top, rect.right, rect.bottom, opts.depthAt), role: 'glass', z: SHELL_Z.glass },
    ...paneEdges(rect, trace, SHELL_Z.frame, outerW, opts),
  ];
}

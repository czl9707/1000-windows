// The furniture drawer: one pure emitter per kind — twelve constructions of
// tall silhouette masses — turning a furnished plane into marks. Every piece
// reads as a mass first: its body fills dress in the room's single
// `furniture` colourway role, and the ink line work at the detail weight
// (one step heavier than the sill items') carries the identity strokes —
// object edges draw full, a run of repeated interior lines obeys the hand
// rule. Nothing fills in paper, which dies into the background. Each plane's
// depth rides on the points (the projection scales the piece) and its
// bucket on the marks (the draw stage orders the planes back to front).
// Trace names are bare ids unique within a window — the plane's number is
// part of every name.
import type { Mark } from '@/core/scene';
import { WEIGHTS } from '@/styling/weights';
import type { ColorRole } from '@/styling/roles';
import { line, rectPts, type PaneRect } from '@/core/window-shell/shell';
import { PLANE_DEPTH, PLANE_SCALE, PLANE_Z, type FurnitureKind } from './catalogue';
import type { FurniturePlan, FurnishedPlane } from './furniture';

// The kind constants of the silhouette, in unit measure: the footprint and
// the height that breaks the sill line. Base drop: how far under the
// opening's bottom edge a base stands, hidden behind the frame's bottom rail.
const SILHOUETTES: Record<FurnitureKind, { w: number; h: number }> = {
  bookshelf: { w: 0.42, h: 0.56 },
  wardrobe: { w: 0.36, h: 0.62 },
  dresser: { w: 0.44, h: 0.3 },
  tvStand: { w: 0.5, h: 0.34 },
  coatStand: { w: 0.16, h: 0.55 },
  coatRack: { w: 0.3, h: 0.44 },
  ladderShelf: { w: 0.32, h: 0.5 },
  dryingRack: { w: 0.4, h: 0.4 },
  easel: { w: 0.3, h: 0.48 },
  mirror: { w: 0.2, h: 0.5 },
  roomDivider: { w: 0.42, h: 0.58 },
  crates: { w: 0.3, h: 0.3 },
};

const BASE_DROP = 0.14;
const GOLDEN_ANGLE = 2.399;

// The hand rule: a run of repeated interior lines on a mass is never fully
// drawn — some are omitted outright, a kept line covers only part of its
// run — picked by the golden-angle sine, deterministic, no stream draw.
// Object edges draw full; the helpers here exist for the runs.
const LINE_OMIT = 0.18;
const LINE_MIN_SPAN = 0.45;

const omitLine = (i: number): boolean => Math.sin(i * GOLDEN_ANGLE + 1.3) < 2 * LINE_OMIT - 1;

// One plane's drawing context: the depth the points carry and the bucket
// the marks sort by. Built per furnished plane by pieceMarks.
interface Ctx {
  depth: number;
  z: number;
  trace: string;
}

// The anchored rectangle a piece draws in, in unit measure: clamped inside
// the opening's width, base sunk below the opening's bottom edge.
interface Spot {
  x0: number;
  x1: number;
  // The base's y, below the opening's bottom edge, never drawn as such.
  baseY: number;
  // The top's y, above the sill line.
  topY: number;
  cx: number;
  w: number;
  h: number;
}

function spotOf(plan: FurnishedPlane, planeIndex: number, o: PaneRect): Spot {
  const sil = SILHOUETTES[plan.kind];
  const h = sil.h * PLANE_SCALE[planeIndex];
  const w = sil.w * plan.widthJitter;
  const cx = o.left + (o.right - o.left) * plan.anchorX;
  const x0 = Math.min(Math.max(cx - w / 2, o.left), o.right - w);
  return {
    x0,
    x1: x0 + w,
    baseY: o.bottom + BASE_DROP,
    topY: o.bottom + BASE_DROP - h,
    cx: x0 + w / 2,
    w,
    h,
  };
}

const fill = (c: Ctx, role: ColorRole, x0: number, y0: number, x1: number, y1: number): Mark => ({
  kind: 'fill',
  pts: rectPts(x0, y0, x1, y1, () => c.depth),
  role,
  z: c.z,
});

function inkLine(c: Ctx, name: string, x0: number, y0: number, x1: number, y1: number): Mark {
  return { kind: 'stroke', pts: line(x0, y0, x1, y1, () => c.depth), name, widthUnits: WEIGHTS.detail, role: 'ink', z: c.z };
}

function outline(c: Ctx, name: string, x0: number, y0: number, x1: number, y1: number): Mark {
  return { kind: 'stroke', pts: rectPts(x0, y0, x1, y1, () => c.depth), name, widthUnits: WEIGHTS.detail, role: 'ink', z: c.z };
}

function dotMark(c: Ctx, name: string, x: number, y: number, r: number): Mark {
  return { kind: 'dot', pts: [{ x, y, z: c.depth }], r, name, role: 'ink', z: c.z };
}

// A hand-ruled horizontal run: omitted outright some of the time, otherwise
// kept over only part of its span.
function handLine(c: Ctx, name: string, i: number, y: number, x0: number, x1: number): Mark[] {
  if (omitLine(i)) return [];
  const start = Math.abs(Math.sin(i * GOLDEN_ANGLE + 0.7)) * (1 - LINE_MIN_SPAN);
  const end = 1 - Math.abs(Math.sin(i * GOLDEN_ANGLE + 2.1)) * (1 - LINE_MIN_SPAN);
  return [inkLine(c, name, x0 + (x1 - x0) * start, y, x0 + (x1 - x0) * end, y)];
}

// A leaning rail from a base point to a top point, as one stroke.
function rail(c: Ctx, name: string, x0: number, y0: number, x1: number, y1: number): Mark {
  return inkLine(c, name, x0, y0, x1, y1);
}

// A body mass with its outline: every kind starts here, the outline the
// object edge that always draws full.
function body(c: Ctx, name: string, s: Spot, x0 = s.x0, y0 = s.topY, x1 = s.x1, y1 = s.baseY): Mark[] {
  return [fill(c, 'furniture', x0, y0, x1, y1), outline(c, `${name}-edge`, x0, y0, x1, y1)];
}

// — the twelve constructions —

function bookshelf(c: Ctx, s: Spot, plan: FurnishedPlane): Mark[] {
  const marks = body(c, `${c.trace}-bookshelf`, s);
  const shelves = 4;
  for (let i = 0; i < shelves; i++) {
    const y = s.topY + ((i + 1) / (shelves + 1)) * s.h;
    marks.push(...handLine(c, `${c.trace}-bookshelf-shelf-${i}`, i, y, s.x0, s.x1));
  }
  // A few upright spines per shelf bay, their heights off the golden-angle
  // sine; the count is the kind's variant roll.
  const count = 3 + Math.floor(plan.variant * 4);
  for (let i = 0; i < count; i++) {
    const bay = i % shelves;
    const shelfY = s.topY + ((bay + 1) / (shelves + 1)) * s.h;
    const x = s.x0 + s.w * (0.14 + 0.7 * Math.abs(Math.sin(i * GOLDEN_ANGLE + 0.4)));
    const top = shelfY - s.h * (0.08 + 0.1 * Math.abs(Math.sin(i * GOLDEN_ANGLE + 1.9)));
    marks.push(inkLine(c, `${c.trace}-bookshelf-spine-${i}`, x, top, x, shelfY));
  }
  return marks;
}

function wardrobe(c: Ctx, s: Spot): Mark[] {
  const marks = body(c, `${c.trace}-wardrobe`, s);
  const midY = s.topY + s.h * 0.45;
  marks.push(inkLine(c, `${c.trace}-wardrobe-seam`, s.cx, s.topY, s.cx, midY));
  marks.push(dotMark(c, `${c.trace}-wardrobe-handle-l`, s.cx - s.w * 0.06, s.h * 0.5 + s.topY, 0.008));
  marks.push(dotMark(c, `${c.trace}-wardrobe-handle-r`, s.cx + s.w * 0.06, s.h * 0.5 + s.topY, 0.008));
  return marks;
}

function dresser(c: Ctx, s: Spot, plan: FurnishedPlane): Mark[] {
  const marks = body(c, `${c.trace}-dresser`, s);
  const rows = 2 + Math.floor(plan.variant * 2);
  for (let i = 0; i < rows; i++) {
    const y = s.topY + ((i + 1) / (rows + 1)) * s.h;
    marks.push(inkLine(c, `${c.trace}-dresser-drawer-${i}`, s.x0, y, s.x1, y));
    marks.push(dotMark(c, `${c.trace}-dresser-pull-${i}`, s.cx, y - s.h / (rows + 1) / 2, 0.007));
  }
  return marks;
}

function tvStand(c: Ctx, s: Spot): Mark[] {
  const standH = s.h * 0.38;
  const standTop = s.baseY - standH;
  const marks = [
    ...body(c, `${c.trace}-tvstand-stand`, s, s.x0, standTop, s.x1, s.baseY),
    // The screen: the permanently dark fill, standing on the stand with a
    // seam of cabinet below — it never lights, in daylight or by lamplight.
    fill(c, 'tvScreen', s.cx - s.w * 0.32, s.topY, s.cx + s.w * 0.32, standTop),
    outline(c, `${c.trace}-tvstand-screen-edge`, s.cx - s.w * 0.32, s.topY, s.cx + s.w * 0.32, standTop),
  ];
  marks.push(...handLine(c, `${c.trace}-tvstand-shelf`, 0, standTop - s.h * 0.1, s.x0, s.x1));
  return marks;
}

function coatStand(c: Ctx, s: Spot, plan: FurnishedPlane): Mark[] {
  const poleTop = s.topY;
  const marks = [
    rail(c, `${c.trace}-coatstand-pole`, s.cx, s.baseY, s.cx, poleTop),
    rail(c, `${c.trace}-coatstand-leg-l`, s.cx, s.baseY - s.h * 0.12, s.cx - s.w * 0.4, s.baseY),
    rail(c, `${c.trace}-coatstand-leg-r`, s.cx, s.baseY - s.h * 0.12, s.cx + s.w * 0.4, s.baseY),
    rail(c, `${c.trace}-coatstand-leg-b`, s.cx, s.baseY - s.h * 0.12, s.cx + s.w * 0.05, s.baseY),
    dotMark(c, `${c.trace}-coatstand-hook-l`, s.cx - s.w * 0.28, poleTop + s.h * 0.08, 0.007),
    dotMark(c, `${c.trace}-coatstand-hook-r`, s.cx + s.w * 0.28, poleTop + s.h * 0.08, 0.007),
  ];
  // A coat over one hook, the mass that makes the stand read at distance;
  // the variant decides the side it hangs, the cloth held inside the spot.
  const side = plan.variant > 0.5 ? 1 : -1;
  const coatX0 = Math.min(Math.max(s.cx + side * s.w * 0.06, s.x0), s.x1);
  const coatX1 = Math.min(Math.max(s.cx + side * s.w * 0.6, s.x0), s.x1);
  marks.push(fill(c, 'furniture', Math.min(coatX0, coatX1), poleTop + s.h * 0.1, Math.max(coatX0, coatX1), s.baseY - s.h * 0.22));
  return marks;
}

function coatRack(c: Ctx, s: Spot, plan: FurnishedPlane): Mark[] {
  const boardW = s.w * 0.16;
  const marks = [
    ...body(c, `${c.trace}-coatrack-board`, s, s.cx - boardW / 2, s.topY, s.cx + boardW / 2, s.baseY),
    // One hanging coat off a peg, the mass that makes the rack read.
    fill(c, 'furniture', s.cx - boardW / 2 - s.w * 0.22, s.topY + s.h * 0.12, Math.min(s.cx + boardW / 2 + s.w * 0.1, s.x1), s.baseY - s.h * 0.16),
    dotMark(c, `${c.trace}-coatrack-peg-0`, s.cx - boardW * 0.7, s.topY + s.h * 0.16, 0.006),
    dotMark(c, `${c.trace}-coatrack-peg-1`, s.cx + boardW * 0.7, s.topY + s.h * 0.16, 0.006),
    dotMark(c, `${c.trace}-coatrack-peg-2`, s.cx, s.topY + s.h * 0.3, 0.006),
  ];
  // A second coat on the variant's say-so.
  if (plan.variant > 0.6) {
    marks.push(fill(c, 'furniture', Math.max(s.cx - boardW / 2 - s.w * 0.05, s.x0), s.topY + s.h * 0.2, s.cx + boardW / 2 + s.w * 0.24, s.baseY - s.h * 0.24));
  }
  return marks;
}

function ladderShelf(c: Ctx, s: Spot): Mark[] {
  const lean = s.w * 0.22;
  const marks = [
    rail(c, `${c.trace}-laddershelf-rail-a`, s.cx - s.w * 0.3, s.baseY, s.cx - s.w * 0.3 + lean, s.topY),
    rail(c, `${c.trace}-laddershelf-rail-b`, s.cx + s.w * 0.3, s.baseY, Math.min(s.cx + s.w * 0.3 + lean, s.x1), s.topY),
  ];
  const rungs = 4;
  for (let i = 0; i < rungs; i++) {
    const t = (i + 1) / (rungs + 1);
    const y = s.baseY - t * s.h;
    const shift = lean * t;
    const x0 = s.cx - s.w * 0.3 + shift;
    // The lean must not walk the rung past the spot's edge.
    const x1 = Math.min(s.cx + s.w * 0.3 + shift, s.x1);
    marks.push(inkLine(c, `${c.trace}-laddershelf-rung-${i}`, x0, y, x1, y));
    marks.push(fill(c, 'furniture', x0, y - s.h * 0.05, x1, y));
  }
  return marks;
}

function dryingRack(c: Ctx, s: Spot): Mark[] {
  const halfW = s.w * 0.42;
  const marks = [
    rail(c, `${c.trace}-dryingrack-leg-a`, s.cx - halfW, s.baseY, s.cx - halfW * 0.6, s.topY),
    rail(c, `${c.trace}-dryingrack-leg-b`, s.cx + halfW, s.baseY, s.cx + halfW * 0.6, s.topY),
    rail(c, `${c.trace}-dryingrack-bar`, s.cx - halfW * 0.6, s.topY, s.cx + halfW * 0.6, s.topY),
    // A draped cloth over the bar, the room's own colour.
    fill(c, 'furniture', s.cx - halfW * 0.5, s.topY, s.cx + halfW * 0.2, s.baseY - s.h * 0.3),
  ];
  marks.push(...handLine(c, `${c.trace}-dryingrack-hem`, 0, s.baseY - s.h * 0.3, s.cx - halfW * 0.5, s.cx + halfW * 0.2));
  return marks;
}

function easel(c: Ctx, s: Spot): Mark[] {
  const marks = [
    rail(c, `${c.trace}-easel-leg-l`, s.cx - s.w * 0.3, s.baseY, s.cx - s.w * 0.12, s.topY),
    rail(c, `${c.trace}-easel-leg-r`, s.cx + s.w * 0.3, s.baseY, s.cx + s.w * 0.12, s.topY),
    rail(c, `${c.trace}-easel-leg-rear`, s.cx, s.baseY, s.cx, s.topY + s.h * 0.2),
    // The canvas, leaning: its own mass in the room's colour.
    fill(c, 'furniture', s.cx - s.w * 0.26, s.topY, s.cx + s.w * 0.26, s.topY + s.h * 0.62),
    outline(c, `${c.trace}-easel-canvas-edge`, s.cx - s.w * 0.26, s.topY, s.cx + s.w * 0.26, s.topY + s.h * 0.62),
    rail(c, `${c.trace}-easel-tray`, s.cx - s.w * 0.3, s.topY + s.h * 0.66, s.cx + s.w * 0.3, s.topY + s.h * 0.66),
  ];
  return marks;
}

function mirror(c: Ctx, s: Spot): Mark[] {
  const frameW = s.w * 0.12;
  const marks = [
    ...body(c, `${c.trace}-mirror-frame`, s),
    // The glass reads as a pane of it: the wash a shade darker than paper.
    fill(c, 'glass', s.x0 + frameW, s.topY + frameW, s.x1 - frameW, s.baseY - frameW),
    // One shine stroke, the glint the room lends the glass.
    rail(c, `${c.trace}-mirror-shine`, s.x0 + s.w * 0.32, s.baseY - s.h * 0.3, s.x1 - s.w * 0.24, s.topY + s.h * 0.24),
  ];
  return marks;
}

function roomDivider(c: Ctx, s: Spot): Mark[] {
  const marks = body(c, `${c.trace}-roomdivider`, s);
  const panels = 3;
  for (let i = 1; i < panels; i++) {
    const x = s.x0 + (i / panels) * s.w;
    marks.push(inkLine(c, `${c.trace}-roomdivider-seam-${i}`, x, s.topY, x, s.baseY));
    marks.push(dotMark(c, `${c.trace}-roomdivider-hinge-${i}`, x, s.topY + s.h * 0.18, 0.006));
  }
  return marks;
}

function crates(c: Ctx, s: Spot, plan: FurnishedPlane): Mark[] {
  const count = 2 + Math.floor(plan.variant * 3);
  const marks: Mark[] = [];
  const crateH = s.h / count;
  for (let i = 0; i < count; i++) {
    // Each crate jitters a hair off its slot, the stack hand-placed, the
    // jitter held inside the spot.
    const shift = s.w * 0.08 * Math.abs(Math.sin(i * GOLDEN_ANGLE + 0.9)) * (i % 2 === 0 ? 1 : -1);
    const y0 = s.baseY - (i + 1) * crateH;
    const x0 = Math.min(Math.max(s.x0 + shift, s.x0), s.x1 - s.w);
    const x1 = x0 + s.w;
    marks.push(fill(c, 'furniture', x0, y0, x1, y0 + crateH));
    marks.push(outline(c, `${c.trace}-crates-crate-${i}-edge`, x0, y0, x1, y0 + crateH));
    marks.push(...handLine(c, `${c.trace}-crates-crate-${i}-slat`, i, y0 + crateH * 0.5, x0, x1));
  }
  return marks;
}

const DRAWERS: Record<FurnitureKind, (c: Ctx, s: Spot, plan: FurnishedPlane) => Mark[]> = {
  bookshelf,
  wardrobe,
  dresser,
  tvStand,
  coatStand,
  coatRack,
  ladderShelf,
  dryingRack,
  easel,
  mirror,
  roomDivider,
  crates,
};

// The pinned-plan seam: a hand-built FurniturePlan (a demo plate, a bench)
// drawn as-is.
export function pieceMarks(plan: FurniturePlan, opening: PaneRect): Mark[] {
  const marks: Mark[] = [];
  plan.planes.forEach((slot, planeIndex) => {
    if (!slot.present) return;
    const c: Ctx = { depth: PLANE_DEPTH[planeIndex], z: PLANE_Z[planeIndex], trace: `furniture-p${planeIndex + 2}` };
    marks.push(...DRAWERS[slot.kind](c, spotOf(slot, planeIndex, opening), slot));
  });
  return marks;
}

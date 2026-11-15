// The furniture drawer: one pure emitter per kind — coatStand, coatRack,
// ladderShelf, roomDivider, desk — turning a FurniturePiece and the room
// rectangle into the marks of one flat side-silhouette. Every piece is one
// uniform gray mass ('furniture') whose interior detail strokes read in the
// lighter gray ('furnitureDetail'); nothing else dresses here — the desk's
// screen is part of the construction and never emits, painting the same
// silhouette gray as its desk.
//
// The piece stands on the room's real floor, hugging its rolled edge with a
// small gap, and is drawn past the opening — the margins the room grows —
// but clipped to the window box, so nothing lands on the wall around the
// window; the frame face hides the margin band, and projection keeps a
// box-clipped mark inside the box at any parallax drift (deeper planes
// scale inward). Repeated interior strokes (shelf boards, hook rows,
// lattice rows) obey the hand rule, deterministic on the golden-angle sine,
// no stream draw. Trace names are bare ids unique within a window, prefixed
// per piece `furn<plane>-`; the planes are distinct, so the prefixes cannot
// collide.
import type { Mark } from '@/core/scene';
import { clipPoly, clipPolyline } from '@/core/scene/clip';
import { GOLDEN_ANGLE, omitLine, lineSpan } from '@/core/scene/hand';
import type { Pt3 } from '@/motion/projection';
import { WEIGHTS } from '@/styling/weights';
import { BOX, line, rectPts, type PaneRect } from '@/core/window-shell/shell';
import { PLANE_DEPTH, PLANE_Z, type DepthPlane, type FurnitureKind } from './catalogue';
import { roomOf } from './room';
import type { FurniturePiece, FurniturePlan } from './furniture';

// The window box: as far out as furniture may reach before the wall takes
// over. Clipped here, never at the opening — the frame band belongs to the
// room's margins.
const BOX_RECT: PaneRect = {
  left: -BOX.halfW,
  right: BOX.halfW,
  top: -BOX.halfH,
  bottom: BOX.halfH,
};

// Kind constants of the silhouette, in unit measure: widths as shares of
// the opening's own width, heights absolute — the pieces are as tall as
// their real bodies, the floor sits at the room's depth, so only the upper
// body clears the sightline the way the lamp shades do.
const SIZES: Record<FurnitureKind, { w: number; h: number }> = {
  coatStand: { w: 0.16, h: 1.4 },
  coatRack: { w: 0.26, h: 1.3 },
  ladderShelf: { w: 0.3, h: 1.4 },
  roomDivider: { w: 0.3, h: 1.5 },
  desk: { w: 0.52, h: 0.75 },
};

// The hug: very close to the edge, a small gap allowed, wobbling a hair
// with the plane — deterministic, no stream draw.
const GAP_BASE = 0.03;
const GAP_WOBBLE = 0.03;

// The hand rule's rates on the repeated interior strokes: some are omitted
// outright, a kept line covers only part of its run; the mass carries the
// texture.
const DETAIL_OMIT = 0.3;
const DETAIL_MIN_SPAN = 0.6;

const omitDetail = (i: number): boolean => omitLine(i, DETAIL_OMIT);

const detailSpan = (i: number): [number, number] => lineSpan(i, DETAIL_MIN_SPAN);

// Where a piece stands: its footprint hugged to the rolled edge, its base
// on the floor line, its top from the kind's own height.
interface Spot {
  x0: number;
  x1: number;
  floorY: number;
  topY: number;
  w: number;
  h: number;
}

export function drawFurniture(plan: FurniturePlan, opening: PaneRect): Mark[] {
  const room = roomOf(opening);
  const w = opening.right - opening.left;
  const h = opening.bottom - opening.top;
  const drawn: Mark[] = [];
  for (const mark of plan.pieces.flatMap((p) => pieceMarks(p, room, w, h))) {
    const pts =
      mark.kind === 'stroke' ? clipPolyline(mark.pts, BOX_RECT) : clipPoly(mark.pts, BOX_RECT);
    if (pts.length >= (mark.kind === 'stroke' ? 2 : 3)) drawn.push({ ...mark, pts });
  }
  return drawn;
}

function pieceMarks(p: FurniturePiece, room: PaneRect, w: number, h: number): Mark[] {
  const size = SIZES[p.kind];
  const gap = (GAP_BASE + Math.abs(Math.sin(p.plane * GOLDEN_ANGLE)) * GAP_WOBBLE) * w;
  const x0 = p.side === 'left' ? room.left + gap : room.right - gap - size.w * w;
  const spot: Spot = {
    x0,
    x1: x0 + size.w * w,
    floorY: room.bottom,
    topY: room.bottom - size.h * h,
    w,
    h,
  };
  switch (p.kind) {
    case 'coatStand':
      return coatStand(p, spot);
    case 'coatRack':
      return coatRack(p, spot);
    case 'ladderShelf':
      return ladderShelf(p, spot);
    case 'roomDivider':
      return roomDivider(p, spot);
    case 'desk':
      return desk(p, spot);
  }
}

const at = (plane: DepthPlane) => () => PLANE_DEPTH[plane];
const z = (plane: DepthPlane) => PLANE_Z[plane];

function mass(plane: DepthPlane, pts: Pt3[]): Mark {
  return { kind: 'fill', pts, role: 'furniture', z: z(plane) };
}

function detail(name: string, plane: DepthPlane, pts: Pt3[]): Mark {
  return {
    kind: 'stroke',
    pts,
    name,
    widthUnits: WEIGHTS.detail,
    role: 'furnitureDetail',
    z: z(plane),
  };
}

function detailLine(name: string, plane: DepthPlane, x0: number, y0: number, x1: number, y1: number): Mark {
  return detail(name, plane, line(x0, y0, x1, y1, at(plane)));
}

function handDetail(name: string, i: number, plane: DepthPlane, x0: number, y0: number, x1: number, y1: number): Mark[] {
  if (omitDetail(i)) return [];
  const [f0, f1] = detailSpan(i);
  return [
    detailLine(
      name,
      plane,
      x0 + (x1 - x0) * f0,
      y0 + (y1 - y0) * f0,
      x0 + (x1 - x0) * f1,
      y0 + (y1 - y0) * f1,
    ),
  ];
}

function rect(plane: DepthPlane, x0: number, y0: number, x1: number, y1: number): Pt3[] {
  return rectPts(x0, y0, x1, y1, at(plane));
}

function trapezoid(plane: DepthPlane, cx: number, topY: number, topW: number, bottomY: number, bottomW: number): Pt3[] {
  return [
    { x: cx - topW / 2, y: topY, z: at(plane)() },
    { x: cx + topW / 2, y: topY, z: at(plane)() },
    { x: cx + bottomW / 2, y: bottomY, z: at(plane)() },
    { x: cx - bottomW / 2, y: bottomY, z: at(plane)() },
  ];
}

// A coat stand: the pole mass on its splayed foot, the crown's hooks and
// collar as detail strokes.
function coatStand(p: FurniturePiece, s: Spot): Mark[] {
  const pre = `furn${p.plane}`;
  const cx = (s.x0 + s.x1) / 2;
  const poleW = 0.18 * (s.x1 - s.x0);
  const footH = 0.09 * s.h;
  const crown: Mark[] = [];
  for (let i = 0; i < 4; i++) {
    const hx = cx + (i / 3 - 0.5) * 0.8 * (s.x1 - s.x0);
    crown.push(...handDetail(`${pre}-hook-${i}`, i, p.plane, hx, s.topY, hx, s.topY + 0.06 * s.h));
  }
  return [
    mass(p.plane, rect(p.plane, cx - poleW / 2, s.topY, cx + poleW / 2, s.floorY - footH)),
    mass(p.plane, trapezoid(p.plane, cx, s.floorY - footH, poleW, s.floorY, 0.55 * (s.x1 - s.x0))),
    detailLine(`${pre}-collar`, p.plane, cx - 0.3 * (s.x1 - s.x0), s.topY + 0.14 * s.h, cx + 0.3 * (s.x1 - s.x0), s.topY + 0.14 * s.h),
    ...crown,
  ];
}

// A coat rack: the hall-tree frame of two posts under a shelf slab, the
// hook row beneath the shelf obeying the hand rule.
function coatRack(p: FurniturePiece, s: Spot): Mark[] {
  const pre = `furn${p.plane}`;
  const postW = 0.1 * (s.x1 - s.x0);
  const shelfH = 0.05 * s.h;
  const hooks: Mark[] = [];
  for (let i = 0; i < 4; i++) {
    const hx = s.x0 + postW + ((i + 0.5) / 4) * (s.x1 - s.x0 - 2 * postW);
    hooks.push(...handDetail(`${pre}-hook-${i}`, i, p.plane, hx, s.topY + shelfH, hx, s.topY + shelfH + 0.07 * s.h));
  }
  return [
    mass(p.plane, rect(p.plane, s.x0, s.topY + shelfH, s.x0 + postW, s.floorY)),
    mass(p.plane, rect(p.plane, s.x1 - postW, s.topY + shelfH, s.x1, s.floorY)),
    mass(p.plane, rect(p.plane, s.x0, s.topY, s.x1, s.topY + shelfH)),
    detailLine(`${pre}-rail`, p.plane, s.x0 + postW, s.topY + 0.3 * s.h, s.x1 - postW, s.topY + 0.3 * s.h),
    ...hooks,
  ];
}

// A ladder shelf: the leaning side rails as masses, the boards as repeated
// interior strokes under the hand rule.
function ladderShelf(p: FurniturePiece, s: Spot): Mark[] {
  const pre = `furn${p.plane}`;
  const railW = 0.05 * (s.x1 - s.x0);
  const lean = 0.14 * (s.x1 - s.x0);
  const boards: Mark[] = [];
  const count = 5;
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1);
    const y = s.floorY + t * (s.topY - s.floorY);
    const inset = lean * (1 - t) + railW;
    boards.push(...handDetail(`${pre}-board-${i}`, i, p.plane, s.x0 + inset, y, s.x1 - inset, y));
  }
  return [
    mass(p.plane, [
      { x: s.x0, y: s.floorY, z: at(p.plane)() },
      { x: s.x0 + railW, y: s.floorY, z: at(p.plane)() },
      { x: s.x0 + railW + lean, y: s.topY, z: at(p.plane)() },
      { x: s.x0 + lean, y: s.topY, z: at(p.plane)() },
    ]),
    mass(p.plane, [
      { x: s.x1 - railW, y: s.floorY, z: at(p.plane)() },
      { x: s.x1, y: s.floorY, z: at(p.plane)() },
      { x: s.x1 - lean, y: s.topY, z: at(p.plane)() },
      { x: s.x1 - railW - lean, y: s.topY, z: at(p.plane)() },
    ]),
    ...boards,
  ];
}

// A room divider: three tall panels side by side, each carrying two lattice
// rows under the hand rule.
function roomDivider(p: FurniturePiece, s: Spot): Mark[] {
  const pre = `furn${p.plane}`;
  const panels = 3;
  const panelGap = 0.015 * s.w;
  const panelW = ((s.x1 - s.x0) - (panels - 1) * panelGap) / panels;
  const marks: Mark[] = [];
  for (let k = 0; k < panels; k++) {
    const px0 = s.x0 + k * (panelW + panelGap);
    const px1 = px0 + panelW;
    marks.push(mass(p.plane, rect(p.plane, px0, s.topY, px1, s.floorY)));
    for (let r = 0; r < 2; r++) {
      const ry = s.topY + ((r + 1) / 3) * (s.floorY - s.topY);
      marks.push(...handDetail(`${pre}-lattice-${k}-${r}`, k * 2 + r, p.plane, px0 + 0.1 * panelW, ry, px1 - 0.1 * panelW, ry));
    }
  }
  return marks;
}

// A desk: the slab on two legs, the rolled screen sitting on the slab —
// part of the desk's silhouette, the same gray as every piece, never a
// light source. The monitor wears the typical desktop ratio.
function desk(p: FurniturePiece, s: Spot): Mark[] {
  const pre = `furn${p.plane}`;
  const slabH = 0.035 * s.h;
  const deskY = s.topY;
  const legW = 0.07 * (s.x1 - s.x0);
  const cx = (s.x0 + s.x1) / 2 + Math.sin(p.plane * GOLDEN_ANGLE + 0.5) * 0.05 * s.w;
  const marks: Mark[] = [
    mass(p.plane, rect(p.plane, s.x0, deskY, s.x1, deskY + slabH)),
    mass(p.plane, rect(p.plane, s.x0 + 0.02 * s.w, deskY + slabH, s.x0 + 0.02 * s.w + legW, s.floorY)),
    mass(p.plane, rect(p.plane, s.x1 - 0.02 * s.w - legW, deskY + slabH, s.x1 - 0.02 * s.w, s.floorY)),
  ];
  if (p.screen === 'laptop') {
    const lw = 0.32;
    const lh = 0.2;
    marks.push(mass(p.plane, rect(p.plane, cx - lw / 2, deskY - lh, cx + lw / 2, deskY)));
  } else if (p.screen === 'monitor') {
    const standH = 0.04;
    const mh = 0.35;
    const mw = mh * (4 / 3);
    const standW = 0.03 * s.w;
    marks.push(
      mass(p.plane, rect(p.plane, cx - standW / 2, deskY - standH, cx + standW / 2, deskY)),
      mass(p.plane, rect(p.plane, cx - mw / 2, deskY - standH - mh, cx + mw / 2, deskY - standH)),
    );
  }
  return marks;
}

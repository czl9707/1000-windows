// The furniture drawer: one pure emitter per kind — coatStand, coatRack,
// ladderShelf, roomDivider, desk — turning a FurniturePiece and the room
// rectangle into the marks of one flat side-silhouette. Every piece is one
// uniform gray ('furniture') and nothing else dresses here — no interior
// strokes, no second gray; what the construction needs to read (the ladder
// shelf's boards) is part of the silhouette mass, the same gray — and the
// desk's screen is part of the construction too, never emitting.
//
// The piece stands on the room's real floor, hugging its rolled edge with a
// small gap, and is drawn whole — the room's margins and the hidden floor
// included — never clipped here: the walk's draw stage clips the interior
// to the opening after projection, so the parallax drift shifts the room
// under a fixed frame and never bares a hard cut.
import type { Mark } from '@/core/scene';
import { GOLDEN_ANGLE } from '@/core/scene/hand';
import type { Pt3 } from '@/motion/projection';
import { rectPts, type PaneRect } from '@/core/window-shell/shell';
import { PLANE_DEPTH, PLANE_Z, type DepthPlane, type FurnitureKind } from './catalogue';
import { roomOf } from './room';
import type { FurniturePiece, FurniturePlan } from './furniture';

// Kind constants of the silhouette, in unit measure: a piece's width as a
// share of the opening's own width, its height absolute — the pieces are as
// tall as their real bodies, the floor sits at the room's depth, so only
// the upper body clears the sightline the way the lamp shades do. The
// desk's screens are absolute throughout.
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
  return plan.pieces.flatMap((p) => pieceMarks(p, room, w, h));
}

function pieceMarks(p: FurniturePiece, room: PaneRect, w: number, h: number): Mark[] {
  const size = SIZES[p.kind];
  const gap = (GAP_BASE + Math.abs(Math.sin(p.plane * GOLDEN_ANGLE)) * GAP_WOBBLE) * w;
  const x0 = p.side === 'left' ? room.left + gap : room.right - gap - size.w * w;
  const spot: Spot = {
    x0,
    x1: x0 + size.w * w,
    floorY: room.bottom,
    topY: room.bottom - size.h,
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

// A coat stand: the pole mass on its splayed foot, a crown cap carrying the
// hooks' suggestion in the silhouette itself.
function coatStand(p: FurniturePiece, s: Spot): Mark[] {
  const cx = (s.x0 + s.x1) / 2;
  const poleW = 0.18 * (s.x1 - s.x0);
  const footH = 0.09 * s.h;
  return [
    mass(p.plane, trapezoid(p.plane, cx, s.topY, 0.85 * (s.x1 - s.x0), s.topY + 0.05 * s.h, 0.3 * (s.x1 - s.x0))),
    mass(p.plane, rect(p.plane, cx - poleW / 2, s.topY + 0.05 * s.h, cx + poleW / 2, s.floorY - footH)),
    mass(p.plane, trapezoid(p.plane, cx, s.floorY - footH, poleW, s.floorY, 0.55 * (s.x1 - s.x0))),
  ];
}

// A coat rack: the hall-tree frame — two posts under a shelf slab, all
// silhouette.
function coatRack(p: FurniturePiece, s: Spot): Mark[] {
  const postW = 0.1 * (s.x1 - s.x0);
  const shelfH = 0.05 * s.h;
  return [
    mass(p.plane, rect(p.plane, s.x0, s.topY + shelfH, s.x0 + postW, s.floorY)),
    mass(p.plane, rect(p.plane, s.x1 - postW, s.topY + shelfH, s.x1, s.floorY)),
    mass(p.plane, rect(p.plane, s.x0, s.topY, s.x1, s.topY + shelfH)),
  ];
}

// A ladder shelf: the leaning side rails with the boards between them —
// the boards are furniture, drawn as silhouette bars of the same gray.
function ladderShelf(p: FurniturePiece, s: Spot): Mark[] {
  const railW = 0.05 * (s.x1 - s.x0);
  const lean = 0.14 * (s.x1 - s.x0);
  const marks: Mark[] = [
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
  ];
  const count = 5;
  const boardH = 0.02 * s.h;
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1);
    const y = s.floorY + t * (s.topY - s.floorY);
    const inset = lean * (1 - t) + railW;
    marks.push(mass(p.plane, rect(p.plane, s.x0 + inset, y - boardH / 2, s.x1 - inset, y + boardH / 2)));
  }
  return marks;
}

// A room divider: three tall panels side by side, all silhouette.
function roomDivider(p: FurniturePiece, s: Spot): Mark[] {
  const panels = 3;
  const panelGap = 0.015 * s.w;
  const panelW = ((s.x1 - s.x0) - (panels - 1) * panelGap) / panels;
  const marks: Mark[] = [];
  for (let k = 0; k < panels; k++) {
    const px0 = s.x0 + k * (panelW + panelGap);
    marks.push(mass(p.plane, rect(p.plane, px0, s.topY, px0 + panelW, s.floorY)));
  }
  return marks;
}

// A desk: the slab on two legs, the rolled screen sitting on the slab —
// part of the desk's silhouette, the same gray as every piece, never a
// light source. The monitor wears the typical desktop ratio.
function desk(p: FurniturePiece, s: Spot): Mark[] {
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
    const standW = 0.03;
    marks.push(
      mass(p.plane, rect(p.plane, cx - standW / 2, deskY - standH, cx + standW / 2, deskY)),
      mass(p.plane, rect(p.plane, cx - mw / 2, deskY - standH - mh, cx + mw / 2, deskY - standH)),
    );
  }
  return marks;
}

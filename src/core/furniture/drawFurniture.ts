// The furniture drawer: one pure emitter per catalogue kind, turning a
// FurniturePiece and the room rectangle into the marks of one flat
// side-silhouette. Every piece is one uniform gray ('furniture') and
// nothing else dresses here — no interior strokes, no second gray; what the
// construction needs to read (the ladder shelf's boards) is part of the
// silhouette mass, the same gray — and the desk's screen is part of the
// construction too, never emitting.
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
  bookcase: { w: 0.32, h: 1.6 },
  wardrobe: { w: 0.5, h: 1.5 },
  dresser: { w: 0.42, h: 0.9 },
  chinaCabinet: { w: 0.34, h: 1.5 },
  hallBench: { w: 0.36, h: 1.0 },
  piano: { w: 0.5, h: 1.15 },
  easel: { w: 0.3, h: 1.5 },
};

// The hug: very close to the edge, a small gap allowed, wobbling a hair
// with the plane — deterministic, no stream draw. A coat stand's real
// geometry stands off the wall, so its kind carries a setback.
const GAP_BASE = 0.03;
const GAP_WOBBLE = 0.03;
const COAT_STAND_SETBACK = 0.05;

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
  const setback = p.kind === 'coatStand' ? COAT_STAND_SETBACK * w : 0;
  const gap = (GAP_BASE + Math.abs(Math.sin(p.plane * GOLDEN_ANGLE)) * GAP_WOBBLE) * w + setback;
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
    case 'bookcase':
      return bookcase(p, spot);
    case 'wardrobe':
      return wardrobe(p, spot);
    case 'dresser':
      return dresser(p, spot);
    case 'chinaCabinet':
      return chinaCabinet(p, spot);
    case 'hallBench':
      return hallBench(p, spot);
    case 'piano':
      return piano(p, spot);
    case 'easel':
      return easel(p, spot);
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

// Evenly spaced horizontal bars filling a span — the shelf boards, the
// cabinet rails — as silhouette masses of the same gray. The inset may
// taper with the run (the leaning shelf's boards chase the rails).
function barsBetween(
  plane: DepthPlane,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  count: number,
  barH: number,
  insetAt: (t: number) => number,
): Pt3[][] {
  const bars: Pt3[][] = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1);
    const y = y0 + t * (y1 - y0);
    const inset = insetAt(t);
    bars.push(rect(plane, x0 + inset, y - barH / 2, x1 - inset, y + barH / 2));
  }
  return bars;
}

function trapezoid(plane: DepthPlane, cx: number, topY: number, topW: number, bottomY: number, bottomW: number): Pt3[] {
  return [
    { x: cx - topW / 2, y: topY, z: at(plane)() },
    { x: cx + topW / 2, y: topY, z: at(plane)() },
    { x: cx + bottomW / 2, y: bottomY, z: at(plane)() },
    { x: cx - bottomW / 2, y: bottomY, z: at(plane)() },
  ];
}

// A coat stand: the slim pole on splayed legs, the hooks as peg masses
// reaching out sideways at staggered heights — nothing lamp-like about it.
function coatStand(p: FurniturePiece, s: Spot): Mark[] {
  const cx = (s.x0 + s.x1) / 2;
  const poleW = 0.12 * (s.x1 - s.x0);
  const footH = 0.07 * s.h;
  const spread = 0.42 * (s.x1 - s.x0);
  const legW = 0.05 * (s.x1 - s.x0);
  const marks: Mark[] = [
    mass(p.plane, rect(p.plane, cx - poleW / 2, s.topY, cx + poleW / 2, s.floorY - footH)),
    mass(p.plane, [
      { x: cx - poleW / 2, y: s.floorY - footH, z: at(p.plane)() },
      { x: cx, y: s.floorY - footH, z: at(p.plane)() },
      { x: cx - spread + legW, y: s.floorY, z: at(p.plane)() },
      { x: cx - spread, y: s.floorY, z: at(p.plane)() },
    ]),
    mass(p.plane, [
      { x: cx, y: s.floorY - footH, z: at(p.plane)() },
      { x: cx + poleW / 2, y: s.floorY - footH, z: at(p.plane)() },
      { x: cx + spread, y: s.floorY, z: at(p.plane)() },
      { x: cx + spread - legW, y: s.floorY, z: at(p.plane)() },
    ]),
  ];
  // The hooks reach out from the crown, where a coat stand's arms live.
  const pegL = 0.34 * (s.x1 - s.x0);
  const pegH = 0.022 * s.h;
  for (let i = 0; i < 4; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const py = s.topY + 0.03 * s.h + Math.floor(i / 2) * 0.06 * s.h;
    const px = side < 0 ? cx - poleW / 2 - pegL : cx + poleW / 2;
    marks.push(mass(p.plane, rect(p.plane, px, py, px + pegL, py + pegH)));
  }
  return marks;
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
  for (const pts of barsBetween(p.plane, s.x0, s.floorY, s.x1, s.topY, count, boardH, (t) => lean * (1 - t) + railW)) {
    marks.push(mass(p.plane, pts));
  }
  return marks;
}

// A room divider: three tall panels side by side, nearly touching — the
// gaps read as folds, not separate boards.
function roomDivider(p: FurniturePiece, s: Spot): Mark[] {
  const panels = 3;
  const panelGap = 0.006 * s.w;
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
    const lw = 0.34;
    const lh = 0.26;
    marks.push(mass(p.plane, rect(p.plane, cx - lw / 2, deskY - lh, cx + lw / 2, deskY)));
  } else if (p.screen === 'monitor') {
    const standH = 0.05;
    const mh = 0.45;
    const mw = mh * (4 / 3);
    const standW = 0.03;
    marks.push(
      mass(p.plane, rect(p.plane, cx - standW / 2, deskY - standH, cx + standW / 2, deskY)),
      mass(p.plane, rect(p.plane, cx - mw / 2, deskY - standH - mh, cx + mw / 2, deskY - standH)),
    );
  }
  return marks;
}

// A bookcase: the upright case — two side panels under a top slab, the
// shelves between them bars of the same gray.
function bookcase(p: FurniturePiece, s: Spot): Mark[] {
  const sideW = 0.07 * (s.x1 - s.x0);
  const slabH = 0.04 * s.h;
  const marks: Mark[] = [
    mass(p.plane, rect(p.plane, s.x0, s.topY + slabH, s.x0 + sideW, s.floorY)),
    mass(p.plane, rect(p.plane, s.x1 - sideW, s.topY + slabH, s.x1, s.floorY)),
    mass(p.plane, rect(p.plane, s.x0, s.topY, s.x1, s.topY + slabH)),
  ];
  const count = 4;
  const shelfH = 0.02 * s.h;
  for (const pts of barsBetween(p.plane, s.x0, s.floorY, s.x1, s.topY + slabH, count, shelfH, () => sideW)) {
    marks.push(mass(p.plane, pts));
  }
  return marks;
}

// A wardrobe: the tall body inset under an overhanging cornice, standing on
// a plinth — the case furniture wears.
function wardrobe(p: FurniturePiece, s: Spot): Mark[] {
  const lip = 0.06 * (s.x1 - s.x0);
  const corniceH = 0.05 * s.h;
  const plinthH = 0.06 * s.h;
  return [
    mass(p.plane, rect(p.plane, s.x0, s.topY, s.x1, s.topY + corniceH)),
    mass(p.plane, rect(p.plane, s.x0 + lip, s.topY + corniceH, s.x1 - lip, s.floorY - plinthH)),
    mass(p.plane, rect(p.plane, s.x0 + lip, s.floorY - plinthH, s.x1 - lip, s.floorY)),
  ];
}

// A dresser: the chest with a deeper top slab over it and a narrower base
// under it.
function dresser(p: FurniturePiece, s: Spot): Mark[] {
  const lip = 0.04 * (s.x1 - s.x0);
  const slabH = 0.06 * s.h;
  const baseH = 0.08 * s.h;
  return [
    mass(p.plane, rect(p.plane, s.x0, s.topY, s.x1, s.topY + slabH)),
    mass(p.plane, rect(p.plane, s.x0, s.topY + slabH, s.x1, s.floorY - baseH)),
    mass(p.plane, rect(p.plane, s.x0 + lip, s.floorY - baseH, s.x1 - lip, s.floorY)),
  ];
}

// A china cabinet: the solid chest below, the open shelves above it between
// two side panels under a top slab.
function chinaCabinet(p: FurniturePiece, s: Spot): Mark[] {
  const sideW = 0.07 * (s.x1 - s.x0);
  const slabH = 0.035 * s.h;
  const chestTopY = s.floorY - 0.55 * s.h;
  const marks: Mark[] = [
    mass(p.plane, rect(p.plane, s.x0, chestTopY, s.x1, s.floorY)),
    mass(p.plane, rect(p.plane, s.x0, s.topY, s.x1, s.topY + slabH)),
    mass(p.plane, rect(p.plane, s.x0, s.topY + slabH, s.x0 + sideW, chestTopY)),
    mass(p.plane, rect(p.plane, s.x1 - sideW, s.topY + slabH, s.x1, chestTopY)),
  ];
  const count = 2;
  const shelfH = 0.02 * s.h;
  for (const pts of barsBetween(p.plane, s.x0, chestTopY, s.x1, s.topY + slabH, count, shelfH, () => sideW)) {
    marks.push(mass(p.plane, pts));
  }
  return marks;
}

// A hall bench: the seat slab on two legs, a slatted back rising to a top
// rail.
function hallBench(p: FurniturePiece, s: Spot): Mark[] {
  const seatY = s.floorY - 0.42 * s.h;
  const seatH = 0.05 * s.h;
  const legW = 0.09 * (s.x1 - s.x0);
  const railH = 0.04 * s.h;
  const marks: Mark[] = [
    mass(p.plane, rect(p.plane, s.x0, s.topY, s.x1, s.topY + railH)),
    mass(p.plane, rect(p.plane, s.x0, seatY, s.x1, seatY + seatH)),
    mass(p.plane, rect(p.plane, s.x0, seatY + seatH, s.x0 + legW, s.floorY)),
    mass(p.plane, rect(p.plane, s.x1 - legW, seatY + seatH, s.x1, s.floorY)),
  ];
  const slats = 2;
  const slatW = 0.07 * (s.x1 - s.x0);
  for (let i = 0; i < slats; i++) {
    const x = s.x0 + ((i + 1) / (slats + 1)) * (s.x1 - s.x0);
    marks.push(mass(p.plane, rect(p.plane, x - slatW / 2, s.topY + railH, x + slatW / 2, seatY)));
  }
  return marks;
}

// An upright piano: the tall body under a slanted lid, standing on two legs
// with the front open below.
function piano(p: FurniturePiece, s: Spot): Mark[] {
  const lidDrop = 0.1 * s.h;
  const bodyBottomY = s.floorY - 0.22 * s.h;
  const legW = 0.1 * (s.x1 - s.x0);
  const legTop = s.x0 + 0.08 * (s.x1 - s.x0);
  return [
    mass(p.plane, [
      { x: s.x0, y: s.topY + lidDrop, z: at(p.plane)() },
      { x: s.x1, y: s.topY, z: at(p.plane)() },
      { x: s.x1, y: bodyBottomY, z: at(p.plane)() },
      { x: s.x0, y: bodyBottomY, z: at(p.plane)() },
    ]),
    mass(p.plane, rect(p.plane, legTop, bodyBottomY, legTop + legW, s.floorY)),
    mass(p.plane, rect(p.plane, s.x1 - legTop - legW, bodyBottomY, s.x1 - legTop, s.floorY)),
  ];
}

// An easel: the A-frame — two legs converging to the masthead, a crossbar
// and the tray carrying the canvas suggestion.
function easel(p: FurniturePiece, s: Spot): Mark[] {
  const cx = (s.x0 + s.x1) / 2;
  const legW = 0.09 * (s.x1 - s.x0);
  const capW = 0.5 * legW;
  const marks: Mark[] = [
    mass(p.plane, [
      { x: s.x0, y: s.floorY, z: at(p.plane)() },
      { x: s.x0 + legW, y: s.floorY, z: at(p.plane)() },
      { x: cx + capW / 2, y: s.topY, z: at(p.plane)() },
      { x: cx - capW / 2, y: s.topY, z: at(p.plane)() },
    ]),
    mass(p.plane, [
      { x: s.x1 - legW, y: s.floorY, z: at(p.plane)() },
      { x: s.x1, y: s.floorY, z: at(p.plane)() },
      { x: cx + capW / 2, y: s.topY, z: at(p.plane)() },
      { x: cx - capW / 2, y: s.topY, z: at(p.plane)() },
    ]),
  ];
  const trayY = s.floorY - 0.35 * s.h;
  const barH = 0.015 * s.h;
  marks.push(
    mass(p.plane, rect(p.plane, s.x0 + 0.1 * (s.x1 - s.x0), trayY, s.x1 - 0.1 * (s.x1 - s.x0), trayY + barH)),
    mass(p.plane, rect(p.plane, s.x0 + 0.2 * (s.x1 - s.x0), s.floorY - 0.6 * s.h, s.x1 - 0.2 * (s.x1 - s.x0), s.floorY - 0.6 * s.h + barH)),
  );
  return marks;
}

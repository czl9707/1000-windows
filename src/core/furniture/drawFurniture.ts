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
  desk: { w: 0.52, h: 1.0 },
  bookcase: { w: 0.32, h: 1.6 },
  wardrobe: { w: 0.5, h: 1.5 },
  dresser: { w: 0.42, h: 0.9 },
  chinaCabinet: { w: 0.34, h: 1.5 },
  hallBench: { w: 0.36, h: 1.0 },
  piano: { w: 0.5, h: 1.15 },
  easel: { w: 0.3, h: 1.5 },
  monstera: { w: 0.3, h: 1.35 },
  palm: { w: 0.28, h: 1.6 },
  fiddleFig: { w: 0.22, h: 1.5 },
  cactus: { w: 0.3, h: 1.5 },
  snakePlant: { w: 0.2, h: 1.4 },
  yucca: { w: 0.22, h: 1.45 },
  olive: { w: 0.26, h: 1.6 },
  banana: { w: 0.28, h: 1.45 },
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
    case 'monstera':
      return monstera(p, spot);
    case 'palm':
      return palm(p, spot);
    case 'fiddleFig':
      return fiddleFig(p, spot);
    case 'cactus':
      return cactus(p, spot);
    case 'snakePlant':
      return snakePlant(p, spot);
    case 'yucca':
      return yucca(p, spot);
    case 'olive':
      return olive(p, spot);
    case 'banana':
      return banana(p, spot);
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
// light source. The monitor wears the typical desktop ratio. The body
// stands a touch taller than the light layer's lamp desk, so the slab's
// top edge clears the sightline and the screen reads sitting on a desk
// instead of floating over the sill.
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

// A rough convex blob — a leaf mass, a canopy — jittered around an ellipse
// by a fixed phase, no stream draw, the same trick the gap wobble uses.
function blob(plane: DepthPlane, cx: number, cy: number, rx: number, ry: number, n: number, phase: number): Pt3[] {
  const pts: Pt3[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const jitter = 0.75 + 0.5 * Math.abs(Math.sin(phase + i * 2.4));
    pts.push({ x: cx + Math.cos(a) * rx * jitter, y: cy + Math.sin(a) * ry * jitter, z: at(plane)() });
  }
  return pts;
}

// A tapered spike from a base point to a tip — fronds, blades, cactus arms.
function spike(plane: DepthPlane, x0: number, y0: number, x1: number, y1: number, w: number): Pt3[] {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  return [
    { x: x0 + nx * w, y: y0 + ny * w, z: at(plane)() },
    { x: x1, y: y1, z: at(plane)() },
    { x: x0 - nx * w, y: y0 - ny * w, z: at(plane)() },
  ];
}

// The plants: furniture-sized greenery standing on the room floor, one
// flat gray silhouette like every piece. The kinds were tried on the
// throwaway eyeball bench (branch `prototype/plant-bench`) — ten
// candidates, the eight that read through the window landed; a plant that
// never clears the sightline is invisible, and a construction measured
// against the opening instead of its own footprint sprawls. Every measure
// below is the piece's own footprint and height. Decided in the wayfinder
// ticket "Plants — green life in the window".

function monstera(p: FurniturePiece, s: Spot): Mark[] {
  const pw = s.x1 - s.x0;
  const ph = s.floorY - s.topY;
  const cx = (s.x0 + s.x1) / 2;
  const potTop = s.floorY - 0.12 * ph;
  const marks: Mark[] = [mass(p.plane, trapezoid(p.plane, cx, potTop, 0.6 * pw, s.floorY, 0.5 * pw))];
  const stems = 5;
  for (let i = 0; i < stems; i++) {
    const t = i / (stems - 1);
    const tipX = cx + (t - 0.5) * 0.9 * pw;
    const leafCy = s.topY + 0.1 * ph + Math.abs(Math.sin(i * 2.2)) * 0.16 * ph;
    marks.push(
      mass(p.plane, spike(p.plane, cx, potTop, tipX, leafCy + 0.08 * ph, 0.03 * pw)),
      mass(p.plane, blob(p.plane, tipX, leafCy, 0.3 * pw, 0.11 * ph, 9, i * 3.1)),
    );
  }
  return marks;
}

function palm(p: FurniturePiece, s: Spot): Mark[] {
  const pw = s.x1 - s.x0;
  const ph = s.floorY - s.topY;
  const cx = (s.x0 + s.x1) / 2;
  const trunkW = 0.09 * pw;
  const crownY = s.topY + 0.16 * ph;
  const marks: Mark[] = [
    mass(p.plane, trapezoid(p.plane, cx, s.floorY - 0.1 * ph, 0.45 * pw, s.floorY, 0.38 * pw)),
    mass(p.plane, rect(p.plane, cx - trunkW / 2, crownY, cx + trunkW / 2, s.floorY - 0.08 * ph)),
  ];
  const fronds = 8;
  for (let i = 0; i < fronds; i++) {
    const a = Math.PI + (i / (fronds - 1)) * Math.PI;
    marks.push(
      mass(
        p.plane,
        spike(
          p.plane,
          cx,
          crownY,
          cx + Math.cos(a) * 0.65 * pw,
          crownY + Math.sin(a) * 0.08 * ph,
          0.06 * pw,
        ),
      ),
    );
  }
  return marks;
}

function fiddleFig(p: FurniturePiece, s: Spot): Mark[] {
  const pw = s.x1 - s.x0;
  const ph = s.floorY - s.topY;
  const cx = (s.x0 + s.x1) / 2;
  const trunkW = 0.12 * pw;
  const marks: Mark[] = [
    mass(p.plane, trapezoid(p.plane, cx, s.floorY - 0.12 * ph, 0.45 * pw, s.floorY, 0.38 * pw)),
    mass(p.plane, rect(p.plane, cx - trunkW / 2, s.topY + 0.2 * ph, cx + trunkW / 2, s.floorY - 0.1 * ph)),
  ];
  const leaves = 6;
  for (let i = 0; i < leaves; i++) {
    const t = i / (leaves - 1);
    const ly = s.topY + 0.04 * ph + t * 0.42 * ph;
    const side = i % 2 === 0 ? -1 : 1;
    const lx = cx + side * (0.3 * pw + Math.abs(Math.sin(i * 1.9)) * 0.14 * pw);
    marks.push(mass(p.plane, blob(p.plane, lx, ly, 0.38 * pw, 0.1 * ph, 10, i * 2.1)));
  }
  return marks;
}

// A saguaro: the tall column with two arms reaching up. The arms make the
// column read as cactus — a bare stick reads as nothing.
function cactus(p: FurniturePiece, s: Spot): Mark[] {
  const pw = s.x1 - s.x0;
  const ph = s.floorY - s.topY;
  const cx = (s.x0 + s.x1) / 2 - 0.22 * pw;
  const potTop = s.floorY - 0.08 * ph;
  const trunkW = 0.32 * pw;
  const marks: Mark[] = [
    mass(p.plane, trapezoid(p.plane, cx, potTop, 0.34 * pw, s.floorY, 0.28 * pw)),
    mass(p.plane, trapezoid(p.plane, cx, s.topY + 0.02 * ph, trunkW * 0.85, potTop, trunkW)),
  ];
  const armH = 0.28 * ph;
  for (const [side, rise] of [
    [-1, 0.6],
    [1, 0.48],
  ] as const) {
    const armBaseY = potTop - rise * ph;
    const ax = cx + side * (trunkW / 2 + 0.14 * pw);
    marks.push(
      mass(p.plane, spike(p.plane, cx + side * trunkW * 0.4, armBaseY + 0.1 * ph, ax, armBaseY, 0.1 * pw)),
      mass(p.plane, spike(p.plane, ax, armBaseY, ax, armBaseY - armH, 0.18 * pw)),
    );
  }
  return marks;
}

function snakePlant(p: FurniturePiece, s: Spot): Mark[] {
  const pw = s.x1 - s.x0;
  const ph = s.floorY - s.topY;
  const cx = (s.x0 + s.x1) / 2;
  const baseY = s.floorY - 0.06 * ph;
  const marks: Mark[] = [
    mass(p.plane, trapezoid(p.plane, cx, s.floorY - 0.08 * ph, 0.6 * pw, s.floorY, 0.5 * pw)),
  ];
  const blades = 7;
  for (let i = 0; i < blades; i++) {
    const t = i / (blades - 1);
    const bx = s.x0 + 0.14 * pw + t * 0.72 * pw;
    const bh = (0.55 + Math.abs(Math.sin(i * 2.6)) * 0.42) * (ph - 0.08 * ph);
    marks.push(mass(p.plane, spike(p.plane, bx, baseY, bx + (t - 0.5) * 0.12 * pw, baseY - bh, 0.28 * pw)));
  }
  return marks;
}

function yucca(p: FurniturePiece, s: Spot): Mark[] {
  const pw = s.x1 - s.x0;
  const ph = s.floorY - s.topY;
  const cx = (s.x0 + s.x1) / 2;
  const trunkW = 0.16 * pw;
  const marks: Mark[] = [
    mass(p.plane, trapezoid(p.plane, cx, s.floorY - 0.1 * ph, 0.5 * pw, s.floorY, 0.42 * pw)),
    mass(p.plane, rect(p.plane, cx - trunkW / 2, s.topY + 0.24 * ph, cx + trunkW / 2, s.floorY - 0.08 * ph)),
  ];
  const rosettes = [
    { cx: cx, cy: s.topY + 0.08 * ph, r: 0.68 * pw },
    { cx: cx - 0.34 * pw, cy: s.topY + 0.26 * ph, r: 0.45 * pw },
    { cx: cx + 0.32 * pw, cy: s.topY + 0.28 * ph, r: 0.42 * pw },
  ];
  for (const ro of rosettes) {
    const rays = 9;
    for (let i = 0; i < rays; i++) {
      const a = Math.PI + (i / (rays - 1)) * Math.PI;
      marks.push(
        mass(
          p.plane,
          spike(p.plane, ro.cx, ro.cy, ro.cx + Math.cos(a) * ro.r, ro.cy + Math.sin(a) * ro.r * 0.7, 0.05 * pw),
        ),
      );
    }
  }
  return marks;
}

function olive(p: FurniturePiece, s: Spot): Mark[] {
  const pw = s.x1 - s.x0;
  const ph = s.floorY - s.topY;
  const cx = (s.x0 + s.x1) / 2;
  return [
    mass(p.plane, trapezoid(p.plane, cx, s.floorY - 0.1 * ph, 0.5 * pw, s.floorY, 0.4 * pw)),
    mass(
      p.plane,
      trapezoid(p.plane, cx + 0.04 * pw, s.topY + 0.36 * ph, 0.1 * pw, s.floorY - 0.1 * ph, 0.2 * pw),
    ),
    mass(p.plane, blob(p.plane, cx, s.topY + 0.18 * ph, 0.68 * pw, 0.2 * ph, 12, 0.9)),
  ];
}

function banana(p: FurniturePiece, s: Spot): Mark[] {
  const pw = s.x1 - s.x0;
  const ph = s.floorY - s.topY;
  const cx = (s.x0 + s.x1) / 2;
  const marks: Mark[] = [
    mass(p.plane, trapezoid(p.plane, cx, s.floorY - 0.1 * ph, 0.55 * pw, s.floorY, 0.45 * pw)),
  ];
  const paddles = 6;
  for (let i = 0; i < paddles; i++) {
    const t = i / (paddles - 1);
    const side = i % 2 === 0 ? -1 : 1;
    const tipX = cx + side * (0.2 * pw + t * 0.22 * pw);
    const tipY = s.topY + (i === 0 ? 0.02 : 0.08 + Math.abs(Math.sin(i * 1.7)) * 0.1) * ph;
    marks.push(
      mass(p.plane, blob(p.plane, tipX, tipY + 0.15 * ph, 0.3 * pw, 0.17 * ph, 8, i * 3.3)),
      mass(p.plane, spike(p.plane, cx, s.floorY - 0.08 * ph, tipX, tipY + 0.26 * ph, 0.03 * pw)),
    );
  }
  return marks;
}

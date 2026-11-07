// The sill drawer: one pure emitter per kind — books, mug, jars, plant,
// clock — turning an anchored plan into the marks of one flat side-silhouette
// on the inside ledge. Every item reads as a mass first: its fills dress in
// visible colourway roles (frame paint, box wood, cloth, glass), and the ink
// line work at the texture weight carries only the identity strokes on top —
// nothing fills in paper, which dies into the background. Points sit at the
// ledge depth; the z rides only as the sort bucket. Trace names are bare ids
// unique within a window.
import type { Mark } from '@/core/scene';
import { WEIGHTS } from '@/styling/weights';
import type { ColorRole } from '@/styling/roles';
import { line, rectPts, type PaneRect } from '@/core/window-shell/shell';
import { CORNER_INSET, LEDGE_OVERLAP, SILL_ITEM_DEPTH, SILL_ITEM_Z, SIDE_TUCK, type PlantKind, type SillKind } from './catalogue';
import type { AnchoredSill, SillPlan } from './sill';

// The kind constants of the silhouette, in unit measure — every height
// stays under half the opening's height.
const SILHOUETTES: Record<SillKind, { w: number; h: number }> = {
  books: { w: 0.24, h: 0.22 },
  mug: { w: 0.12, h: 0.12 },
  jars: { w: 0.22, h: 0.16 },
  plant: { w: 0.2, h: 0.28 },
  clock: { w: 0.14, h: 0.14 },
};

// The plant vocabulary's own silhouettes — the pot's footprint and the
// greenery's reach differ per kind.
const PLANT_SILHOUETTES: Record<PlantKind, { w: number; h: number }> = {
  rubber: { w: 0.2, h: 0.3 },
  snake: { w: 0.22, h: 0.26 },
  split: { w: 0.2, h: 0.3 },
  cactus: { w: 0.26, h: 0.22 },
  palm: { w: 0.24, h: 0.3 },
  herb: { w: 0.16, h: 0.22 },
  flowering: { w: 0.16, h: 0.26 },
};

const JAR_COUNT = 3;
const GOLDEN_ANGLE = 2.399;

// The anchored rectangle an item draws in: hugging its rolled corner,
// standing on the ledge with its base cut by the frame's bottom rail.
interface Spot {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const atDepth = () => SILL_ITEM_DEPTH;

function fill(role: ColorRole, x0: number, y0: number, x1: number, y1: number): Mark {
  return { kind: 'fill', pts: rectPts(x0, y0, x1, y1, atDepth), role, z: SILL_ITEM_Z };
}

function inkLine(name: string, x0: number, y0: number, x1: number, y1: number): Mark {
  return { kind: 'stroke', pts: line(x0, y0, x1, y1, atDepth), name, widthUnits: WEIGHTS.texture, role: 'ink', z: SILL_ITEM_Z };
}

function outline(name: string, x0: number, y0: number, x1: number, y1: number): Mark {
  return { kind: 'stroke', pts: rectPts(x0, y0, x1, y1, atDepth), name, widthUnits: WEIGHTS.texture, role: 'ink', z: SILL_ITEM_Z };
}

function polygon(pts: { x: number; y: number }[]): { x: number; y: number; z: number }[] {
  return pts.map((p) => ({ ...p, z: SILL_ITEM_DEPTH }));
}

function circle(cx: number, cy: number, r: number, n = 16): { x: number; y: number; z: number }[] {
  return polygon(
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * 2 * Math.PI;
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    }),
  );
}

function dotMark(name: string, x: number, y: number, r: number): Mark {
  return { kind: 'dot', pts: [{ x, y, z: SILL_ITEM_DEPTH }], r, name, role: 'ink', z: SILL_ITEM_Z };
}

export function spot(plan: AnchoredSill, o: PaneRect): Spot {
  const size = plan.kind === 'plant' ? PLANT_SILHOUETTES[plan.plantKind] : SILHOUETTES[plan.kind];
  const width = size.w * plan.widthJitter;
  const y1 = o.bottom + LEDGE_OVERLAP;
  const y0 = y1 - size.h;
  // The books tuck into the side band; every other kind holds its gap from
  // the jamb.
  if (plan.kind === 'books') {
    const x1 = plan.side === 'left' ? o.left - SIDE_TUCK + width : o.right + SIDE_TUCK;
    return { x0: x1 - width, y0, x1, y1 };
  }
  const x1 = plan.side === 'left' ? o.left + CORNER_INSET + width : o.right - CORNER_INSET;
  return { x0: x1 - width, y0, x1, y1 };
}

// A row of separate volumes: one book per rolled count, each its own mass
// in the frame's paint, height and thickness off the golden-angle sine
// (deterministic, no stream draw). A sine pick gives some books a second
// fill pass — two strengths of the same paint, the cloth mottling's idiom.
// Every vertical draws: each book's left edge, the row's closing right
// edge, no omissions.
function books(plan: AnchoredSill, s: Spot): Mark[] {
  const marks: Mark[] = [inkLine('sill-books-base', s.x0, s.y1, s.x1, s.y1)];
  const count = plan.bookCount;
  const h = s.y1 - s.y0;
  const slotW = (s.x1 - s.x0) / count;
  let lastTop = s.y1;
  let lastX1 = s.x0;
  for (let i = 0; i < count; i++) {
    const top = s.y1 - h * (0.62 + 0.38 * Math.abs(Math.sin(i * GOLDEN_ANGLE + 0.9)));
    const thickness = slotW * (0.62 + 0.3 * Math.abs(Math.sin(i * GOLDEN_ANGLE + 2.2)));
    const x0 = s.x0 + i * slotW + 0.004;
    const x1 = x0 + thickness;
    marks.push(fill('mullion', x0, top, x1, s.y1));
    if (Math.sin(i * GOLDEN_ANGLE + 0.4) > 0.3) marks.push(fill('mullion', x0, top, x1, s.y1));
    marks.push(inkLine(`sill-books-top-${i}`, x0, top, x1, top));
    marks.push(inkLine(`sill-books-spine-${i}`, x0, top, x0, s.y1));
    lastTop = top;
    lastX1 = x1;
  }
  marks.push(inkLine('sill-books-end', lastX1, lastTop, lastX1, s.y1));
  return marks;
}

function mug(plan: AnchoredSill, s: Spot): Mark[] {
  const r = (s.y1 - s.y0) * 0.3;
  const cy = (s.y0 + s.y1) / 2;
  // The handle turns toward the room: off the silhouette's inner edge, so
  // the item never grows past its corner.
  const handleX = plan.side === 'left' ? s.x1 : s.x0;
  const handle = Array.from({ length: 7 }, (_, i) => {
    const a = -Math.PI / 2 + (i / 6) * Math.PI * (plan.side === 'left' ? 1 : -1);
    return { x: handleX + r * 0.8 * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  const rimY = s.y0 + (s.y1 - s.y0) * 0.18;
  return [
    fill('box', s.x0, s.y0, s.x1, s.y1),
    outline('sill-mug-outline', s.x0, s.y0, s.x1, s.y1),
    inkLine('sill-mug-rim', s.x0, rimY, s.x1, rimY),
    { kind: 'stroke', pts: polygon(handle), name: 'sill-mug-handle', widthUnits: WEIGHTS.texture, role: 'ink', z: SILL_ITEM_Z },
  ];
}

// Glass vessels with their contents showing: a fabric band in the lower
// body of each jar, the glass reading as the empty headspace above it.
// Every vertical draws — both sides of every jar, no omissions.
function jars(plan: AnchoredSill, s: Spot): Mark[] {
  const marks: Mark[] = [];
  const jarW = (s.x1 - s.x0) / JAR_COUNT;
  const fromJamb = plan.side === 'left' ? 1 : -1;
  for (let i = 0; i < JAR_COUNT; i++) {
    const near = fromJamb === 1 ? s.x0 + i * jarW : s.x1 - i * jarW;
    const x0 = Math.min(near, near + jarW * 0.85 * fromJamb);
    const x1 = Math.max(near, near + jarW * 0.85 * fromJamb);
    const rimY = s.y0 + (i % 2) * (s.y1 - s.y0) * 0.25;
    const contentY = s.y1 - (s.y1 - rimY) * 0.55;
    marks.push(fill('glass', x0, rimY, x1, s.y1));
    marks.push(fill('fabric', x0, contentY, x1, s.y1));
    marks.push(inkLine(`sill-jars-rim-${i}`, x0, rimY, x1, rimY));
    marks.push(inkLine(`sill-jars-content-${i}`, x0, contentY, x1, contentY));
    marks.push(inkLine(`sill-jars-side-a-${i}`, x0, rimY, x0, s.y1));
    marks.push(inkLine(`sill-jars-side-b-${i}`, x1, rimY, x1, s.y1));
  }
  return marks;
}

// The plant vocabulary: seven constructions, one per rolled kind, every one
// a container in a paint role plus greenery — lens fills, blade polygons,
// wedge fans, dot blooms — with identity strokes at the texture weight and
// golden-angle sine variation. All deterministic, no stream draws.

// A trapezoid pot in a paint role, its rim and both sides inked.
function potAt(cx: number, top: number, w: number, h: number, role: ColorRole, trace: string): Mark[] {
  const rimL = cx - w / 2;
  const rimR = cx + w / 2;
  const baseL = cx - w * 0.32;
  const baseR = cx + w * 0.32;
  return [
    { kind: 'fill', pts: polygon([{ x: rimL, y: top }, { x: rimR, y: top }, { x: baseR, y: top + h }, { x: baseL, y: top + h }]), role, z: SILL_ITEM_Z },
    inkLine(`${trace}-rim`, rimL, top, rimR, top),
    inkLine(`${trace}-side-a`, rimL, top, baseL, top + h),
    inkLine(`${trace}-side-b`, rimR, top, baseR, top + h),
  ];
}

// A lens leaf: two opposing quadratic arcs closed into a fill, plus its
// midrib stroke.
function lens(name: string, bx: number, by: number, angle: number, len: number, wide: number, role: ColorRole): Mark[] {
  const tip = { x: bx + Math.cos(angle) * len, y: by + Math.sin(angle) * len };
  const px = -Math.sin(angle);
  const py = Math.cos(angle);
  const side = (sign: number) =>
    Array.from({ length: 7 }, (_, k) => {
      const t = k / 6;
      const u = 1 - t;
      return {
        x: u * u * bx + 2 * u * t * ((bx + tip.x) / 2 + sign * px * wide) + t * t * tip.x,
        y: u * u * by + 2 * u * t * ((by + tip.y) / 2 + sign * py * wide) + t * t * tip.y,
      };
    });
  const pts = [...side(1), ...side(-1).reverse().slice(1, 6)];
  return [
    { kind: 'fill', pts: polygon(pts), role, z: SILL_ITEM_Z },
    inkLine(`${name}-midrib`, bx, by, tip.x, tip.y),
  ];
}

// One curved stroke arcing from a start point over a control point.
function arcStroke(name: string, from: { x: number; y: number }, ctrl: { x: number; y: number }, to: { x: number; y: number }): Mark {
  const pts = Array.from({ length: 9 }, (_, k) => {
    const t = k / 8;
    const u = 1 - t;
    return {
      x: u * u * from.x + 2 * u * t * ctrl.x + t * t * to.x,
      y: u * u * from.y + 2 * u * t * ctrl.y + t * t * to.y,
    };
  });
  return { kind: 'stroke', pts: polygon(pts), name, widthUnits: WEIGHTS.texture, role: 'ink', z: SILL_ITEM_Z };
}

function rubber(plan: AnchoredSill, s: Spot): Mark[] {
  const cx = (s.x0 + s.x1) / 2;
  const w = s.x1 - s.x0;
  const h = s.y1 - s.y0;
  const pot = potAt(cx, s.y1 - h * 0.28, w * 0.62, h * 0.28, 'mullion', 'sill-plant-rubber-pot');
  const crownY = s.y0 + h * 0.3;
  const marks: Mark[] = [
    ...pot,
    inkLine('sill-plant-rubber-stem', cx, pot[1].pts[0].y, cx, crownY),
  ];
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.52;
    const len = Math.min(
      h * (0.32 + 0.16 * Math.abs(Math.sin(i * GOLDEN_ANGLE + 1.4))),
      (w / 2 - 0.012) / Math.max(0.3, Math.abs(Math.cos(a))),
    );
    marks.push(...lens(`sill-plant-rubber-leaf-${i}`, cx, crownY, a, len, len * 0.52, 'fabric'));
  }
  return marks;
}

function snake(plan: AnchoredSill, s: Spot): Mark[] {
  const cx = (s.x0 + s.x1) / 2;
  const w = s.x1 - s.x0;
  const h = s.y1 - s.y0;
  const potTop = s.y1 - h * 0.2;
  const marks: Mark[] = potAt(cx, potTop, w * 0.74, h * 0.2, 'mullion', 'sill-plant-snake-bowl');
  const rimL = cx - w * 0.3;
  for (let i = 0; i < 7; i++) {
    const bx = rimL + (i / 6) * w * 0.6;
    const tipX = bx + (i - 3) * w * 0.03;
    const tipY = s.y0 + h * 0.12 * Math.abs(Math.sin(i * GOLDEN_ANGLE + 0.6));
    const halfW = w * 0.07;
    marks.push({
      kind: 'fill',
      pts: polygon([
        { x: bx - halfW, y: potTop },
        { x: bx + halfW, y: potTop },
        { x: tipX + halfW * 0.3, y: (potTop + tipY) / 2 },
        { x: tipX, y: tipY },
        { x: tipX - halfW * 0.3, y: (potTop + tipY) / 2 },
      ]),
      role: 'mullion',
      z: SILL_ITEM_Z,
    });
    marks.push(inkLine(`sill-plant-snake-blade-${i}`, bx, potTop, tipX, tipY));
  }
  return marks;
}

function split(plan: AnchoredSill, s: Spot): Mark[] {
  const cx = (s.x0 + s.x1) / 2;
  const w = s.x1 - s.x0;
  const h = s.y1 - s.y0;
  const potTop = s.y1 - h * 0.3;
  const marks: Mark[] = [
    {
      kind: 'fill',
      pts: polygon([
        { x: cx - w * 0.2, y: potTop },
        { x: cx + w * 0.2, y: potTop },
        { x: cx + w * 0.34, y: potTop + h * 0.16 },
        { x: cx + w * 0.26, y: s.y1 },
        { x: cx - w * 0.26, y: s.y1 },
        { x: cx - w * 0.34, y: potTop + h * 0.16 },
      ]),
      role: 'box',
      z: SILL_ITEM_Z,
    },
    inkLine('sill-plant-split-jar-rim', cx - w * 0.2, potTop, cx + w * 0.2, potTop),
  ];
  const crownY = s.y0 + h * 0.24;
  for (let i = 0; i < 4; i++) {
    const tipX = cx + (i - 1.5) * w * 0.2;
    const tip = { x: tipX, y: crownY + h * (0.08 + 0.08 * Math.abs(Math.sin(i * GOLDEN_ANGLE + 0.3))) };
    const ctrl = { x: (cx + tip.x) / 2 + (i - 1.5) * w * 0.06, y: (potTop + tip.y) / 2 };
    marks.push(arcStroke(`sill-plant-split-stalk-${i}`, { x: cx, y: potTop }, ctrl, tip));
    for (let f = 0; f < 5; f++) {
      const a = -Math.PI / 2 + (f - 2) * 0.42;
      marks.push(...lens(`sill-plant-split-finger-${i}-${f}`, tip.x, tip.y, a, h * 0.1, h * 0.03, 'fabric'));
    }
  }
  return marks;
}

function cactus(plan: AnchoredSill, s: Spot): Mark[] {
  const w = s.x1 - s.x0;
  const h = s.y1 - s.y0;
  const potW = w * 0.26;
  const potH = h * 0.22;
  const potY = s.y1 - potH;
  const marks: Mark[] = [];
  const roles: ColorRole[] = ['mullion', 'box', 'mullion'];
  const pots = [s.x0 + w * 0.17, s.x0 + w * 0.47, s.x0 + w * 0.77];
  pots.forEach((cx, i) => marks.push(...potAt(cx, potY, potW, potH, roles[i], `sill-plant-cactus-pot-${i}`)));
  // The ribbed column in the first pot, its cap arched over.
  const colW = potW * 0.34;
  marks.push(fill('mullion', pots[0] - colW / 2, potY - h * 0.58, pots[0] + colW / 2, potY));
  marks.push(inkLine('sill-plant-cactus-cap', pots[0] - colW / 2, potY - h * 0.58, pots[0] + colW / 2, potY - h * 0.58));
  marks.push(inkLine('sill-plant-cactus-rib-a', pots[0] - colW * 0.15, potY - h * 0.58, pots[0] - colW * 0.15, potY));
  marks.push(inkLine('sill-plant-cactus-rib-b', pots[0] + colW * 0.15, potY - h * 0.58, pots[0] + colW * 0.15, potY));
  // The ribbed barrel in the middle.
  const barrelR = potW * 0.34;
  marks.push({ kind: 'fill', pts: circle(pots[1], potY - barrelR, barrelR, 12), role: 'mullion', z: SILL_ITEM_Z });
  marks.push(arcStroke('sill-plant-cactus-barrel-rib', { x: pots[1] - barrelR * 0.6, y: potY }, { x: pots[1], y: potY - barrelR * 2.1 }, { x: pots[1] + barrelR * 0.6, y: potY }));
  // The two-paddle opuntia in the last pot, spines as dots.
  const padR = potW * 0.3;
  marks.push({ kind: 'fill', pts: circle(pots[2] - padR * 0.2, potY - padR, padR, 12), role: 'mullion', z: SILL_ITEM_Z });
  marks.push({ kind: 'fill', pts: circle(pots[2] + padR * 0.55, potY - padR * 1.9, padR * 0.7, 12), role: 'mullion', z: SILL_ITEM_Z });
  for (let i = 0; i < 5; i++) {
    marks.push(dotMark(`sill-plant-cactus-spine-${i}`, pots[2] - padR * 0.2 + (i % 2 ? padR * 0.4 : -padR * 0.4), potY - padR * (0.5 + (i % 3) * 0.4), 0.005));
  }
  return marks;
}

function palm(plan: AnchoredSill, s: Spot): Mark[] {
  const cx = (s.x0 + s.x1) / 2;
  const w = s.x1 - s.x0;
  const h = s.y1 - s.y0;
  const tubH = h * 0.22;
  const tubTop = s.y1 - tubH;
  const marks: Mark[] = [
    fill('box', cx - w * 0.3, tubTop, cx + w * 0.3, s.y1),
    inkLine('sill-plant-palm-band', cx - w * 0.3, tubTop + tubH * 0.3, cx + w * 0.3, tubTop + tubH * 0.3),
  ];
  const reach = Math.min(tubTop - s.y0, w * 0.44);
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.32;
    const r = reach * (0.6 + 0.4 * Math.abs(Math.sin(i * GOLDEN_ANGLE + 1.7)));
    const spread = 0.16;
    marks.push({
      kind: 'fill',
      pts: polygon([
        { x: cx, y: tubTop },
        { x: cx + Math.cos(a - spread) * r, y: tubTop + Math.sin(a - spread) * r },
        { x: cx + Math.cos(a + spread) * r, y: tubTop + Math.sin(a + spread) * r },
      ]),
      role: 'mullion',
      z: SILL_ITEM_Z,
    });
    marks.push(inkLine(`sill-plant-palm-fold-${i}`, cx, tubTop, cx + Math.cos(a) * r, tubTop + Math.sin(a) * r));
  }
  return marks;
}

function herb(plan: AnchoredSill, s: Spot): Mark[] {
  const cx = (s.x0 + s.x1) / 2;
  const w = s.x1 - s.x0;
  const h = s.y1 - s.y0;
  const potTop = s.y1 - h * 0.26;
  const marks: Mark[] = [
    ...potAt(cx, potTop, w * 0.5, h * 0.26, 'mullion', 'sill-plant-herb-jar'),
    inkLine('sill-plant-herb-lip', cx - w * 0.3, potTop - h * 0.03, cx + w * 0.3, potTop - h * 0.03),
    fill('fabric', cx - w * 0.3, s.y0 + h * 0.12, cx + w * 0.3, potTop),
  ];
  for (let i = 0; i < 5; i++) {
    const tipX = cx + (i - 2) * w * 0.16;
    const tipY = s.y0 + h * 0.08 * Math.abs(Math.sin(i * GOLDEN_ANGLE + 1.2));
    marks.push(arcStroke(`sill-plant-herb-stem-${i}`, { x: cx, y: potTop - h * 0.03 }, { x: (cx + tipX) / 2, y: (potTop + tipY) / 2 - h * 0.08 }, { x: tipX, y: tipY }));
    for (let f = 0; f < 2; f++) {
      if (Math.sin((i * 2 + f) * GOLDEN_ANGLE + 0.8) > 0.55) continue;
      marks.push(...lens(`sill-plant-herb-leaf-${i}-${f}`, cx + (tipX - cx) * (0.4 + f * 0.3), (potTop + tipY) / 2 - f * h * 0.06, f === 0 ? -2.4 : -0.75, h * 0.13, h * 0.05, 'fabric'));
    }
  }
  return marks;
}

function flowering(plan: AnchoredSill, s: Spot): Mark[] {
  const cx = (s.x0 + s.x1) / 2;
  const w = s.x1 - s.x0;
  const h = s.y1 - s.y0;
  const potTop = s.y1 - h * 0.3;
  const marks: Mark[] = [
    ...potAt(cx, potTop, w * 0.58, h * 0.26, 'mullion', 'sill-plant-flowering-pot'),
    inkLine('sill-plant-flowering-foot', cx - w * 0.2, s.y1 - h * 0.03, cx + w * 0.2, s.y1 - h * 0.03),
    fill('fabric', cx - w * 0.32, s.y0 + h * 0.2, cx + w * 0.32, potTop),
  ];
  for (let i = 0; i < 8; i++) {
    const a = i * GOLDEN_ANGLE;
    const r = Math.min((potTop - s.y0) * 0.62, w * 0.5 - 0.015) * Math.sqrt((i + 0.5) / 8);
    const bx = cx + Math.cos(a) * r;
    const by = s.y0 + (potTop - s.y0) * (0.3 + 0.6 * Math.abs(Math.sin(a)));
    marks.push(inkLine(`sill-plant-flowering-stem-${i}`, cx, potTop - h * 0.02, bx, by));
    marks.push(dotMark(`sill-plant-flowering-bloom-${i}`, bx, by, 0.011));
  }
  return marks;
}

const PLANT_DRAWERS: Record<PlantKind, (plan: AnchoredSill, s: Spot) => Mark[]> = {
  rubber,
  snake,
  split,
  cactus,
  palm,
  herb,
  flowering,
};

function plant(plan: AnchoredSill, s: Spot): Mark[] {
  return PLANT_DRAWERS[plan.plantKind](plan, s);
}

function clock(plan: AnchoredSill, s: Spot): Mark[] {
  const cx = (s.x0 + s.x1) / 2;
  const cy = (s.y0 + s.y1) / 2;
  const r = Math.min(s.x1 - s.x0, s.y1 - s.y0) / 2;
  return [
    { kind: 'fill', pts: circle(cx, cy, r), role: 'mullion', z: SILL_ITEM_Z },
    { kind: 'stroke', pts: circle(cx, cy, r), name: 'sill-clock-face', widthUnits: WEIGHTS.texture, role: 'ink', z: SILL_ITEM_Z },
    inkLine('sill-clock-hand-min', cx, cy, cx + r * 0.5, cy - r * 0.3),
    inkLine('sill-clock-hand-hour', cx, cy, cx - r * 0.35, cy + r * 0.45),
    dotMark('sill-clock-centre', cx, cy, 0.012),
  ];
}

const DRAWERS: Record<SillKind, (plan: AnchoredSill, s: Spot) => Mark[]> = {
  books,
  mug,
  jars,
  plant,
  clock,
};

// The pinned-plan seam: a hand-built SillPlan (demo plates) drawn as-is.
export function itemMarks(plan: SillPlan, opening: PaneRect): Mark[] {
  if (!plan.present) return [];
  return DRAWERS[plan.kind](plan, spot(plan, opening));
}

// The cloth drawer: one pure emitter per kind — panels, drapes, venetian,
// roman — turning a CurtainPlan into marks behind the glass. The curtain
// reads through the cloth roles alone: the cloth is a base wash and the
// fold bands are the same wash drawn again over it, an irregular number of
// passes per band, so the drape darkens where the cloth turns and mottles
// between folds; no band ever names a colour or a strength — each kind
// carries the role its construction resolves (fabric for hanging cloth,
// shade for the roman, blind for the venetian's slat rows). Trace names are
// bare ids unique within a window — the pen warps each stroke off its name.
// Every curtain line draws at the texture weight, the lightest in the
// catalogue: the cloth's hand reads quieter than the frame's own lines.
import type { Mark } from '@/core/scene/mark';
import { WEIGHTS } from '@/styling/weights';
import type { ColorRole } from '@/styling/roles';
import type { PaneRect } from '@/core/window-shell/shell';
import { line, rectPts } from '@/core/window-shell/shell';
import { CURTAIN_DEPTH, CURTAIN_Z, ROD_CLEARANCE } from './catalogue';
import type { CoveredCurtain, CurtainPlan } from './curtain';

// The cloth stops a hair above the opening's sill.
export const HEM_CLEARANCE = 0.04;
// Fold bands: count per kind, and how far a boundary may wobble off its
// even share, as a share of the band width — the golden-angle sine keeps
// the wobble deterministic without a stream draw.
export const FOLD_BANDS = { panels: 3, drapes: 5, roman: 3 } as const;
const BAND_WOBBLE = 0.08;
const GOLDEN_ANGLE = 2.399;
// The venetian's coarsest slat pitch, in unit measure; the slats distribute
// evenly through the covered band, so the drawn pitch never exceeds this.
const SLAT_MIN_PITCH = 0.045;
// The roman's fold bands bunch above its bottom bar, each this share of the
// covered drop.
const ROMAN_BAND_SHARE = 0.18;

// The hand rule: a run of dense lines on paper is never fully drawn — some
// are omitted outright, and a kept line covers only part of its run; the
// cloth fill carries the texture instead. The golden-angle sine picks the
// omissions and the extents — three phase offsets keep the picks
// decorrelated, and the omit threshold maps the LINE_OMIT rate onto the
// sine's range — deterministic, no stream draw.
const LINE_OMIT = 0.3;
const LINE_MIN_SPAN = 0.55;

const omitLine = (i: number): boolean => Math.sin(i * GOLDEN_ANGLE + 1.3) < 2 * LINE_OMIT - 1;

const lineSpan = (i: number): [number, number] => {
  const start = Math.abs(Math.sin(i * GOLDEN_ANGLE + 0.7)) * (1 - LINE_MIN_SPAN);
  const end = 1 - Math.abs(Math.sin(i * GOLDEN_ANGLE + 2.1)) * (1 - LINE_MIN_SPAN);
  return [start, end];
};

const atDepth = () => CURTAIN_DEPTH;

function clothFill(role: ColorRole, x0: number, y0: number, x1: number, y1: number): Mark {
  return { kind: 'fill', pts: rectPts(x0, y0, x1, y1, atDepth), role, z: CURTAIN_Z };
}

function inkLine(name: string, x0: number, y0: number, x1: number, y1: number): Mark {
  return { kind: 'stroke', pts: line(x0, y0, x1, y1, atDepth), name, width: WEIGHTS.texture, role: 'ink', z: CURTAIN_Z };
}

function handLine(name: string, i: number, x0: number, y0: number, x1: number, y1: number): Mark[] {
  if (omitLine(i)) return [];
  const [f0, f1] = lineSpan(i);
  return [
    inkLine(name, x0 + (x1 - x0) * f0, y0 + (y1 - y0) * f0, x0 + (x1 - x0) * f1, y0 + (y1 - y0) * f1),
  ];
}

// Where the top-hung kinds (venetian, roman) hang from: the rail's line
// inside the opening's head. The hanging cloth (panels, drapes) has no rod
// line to hang from — it runs all the way to the head.
function hangTop(plan: CoveredCurtain, o: PaneRect): number {
  return o.top + ROD_CLEARANCE + plan.rodY;
}

// How deep the top-hung kinds (venetian, roman) descend: the rolled coverage
// as a share of the opening's height, measured from the opening.
function coveredBottom(plan: CoveredCurtain, o: PaneRect): number {
  return o.top + plan.coverage * (o.bottom - o.top);
}

// The fold shading: how many extra passes of the cloth wash a band draws
// over the base, cycled dark / bare / mid so the drape mottles.
function bandShade(i: number): number {
  return i % 3 === 0 ? 2 : i % 3 === 2 ? 1 : 0;
}

// Vertical fold bands across a hanging cloth: shaded bands draw their extra
// passes, each inner boundary carries a fold line. Returns the marks
// appended after the base fill.
function foldBands(
  trace: string,
  x0: number,
  x1: number,
  top: number,
  bottom: number,
  count: number,
): Mark[] {
  const marks: Mark[] = [];
  const bandW = (x1 - x0) / count;
  const wobble = (i: number) => Math.sin(i * GOLDEN_ANGLE) * BAND_WOBBLE * bandW;
  for (let i = 0; i < count; i++) {
    const bx0 = Math.min(Math.max(x0 + i * bandW + wobble(i), x0), x1);
    const bx1 = Math.min(Math.max(x0 + (i + 1) * bandW + wobble(i + 1), x0), x1);
    for (let pass = 0; pass < bandShade(i); pass++) marks.push(clothFill('fabric', bx0, top, bx1, bottom));
    if (i > 0) marks.push(...handLine(`${trace}-fold-${i}`, i, bx0, top, bx0, bottom));
  }
  return marks;
}

function panels(plan: CoveredCurtain, o: PaneRect): Mark[] {
  const top = o.top;
  const bottom = o.bottom - HEM_CLEARANCE;
  const reach = (plan.coverage * (o.right - o.left) * plan.widthJitter) / 2;
  const marks: Mark[] = [];
  for (const side of [-1, 1] as const) {
    const name = side < 0 ? 'l' : 'r';
    const outer = side < 0 ? o.left : o.right;
    const inner = outer - side * reach;
    const [x0, x1] = side < 0 ? [outer, inner] : [inner, outer];
    marks.push(clothFill('fabric', x0, top, x1, bottom));
    marks.push(...foldBands(`panels-${name}`, x0, x1, top, bottom, FOLD_BANDS.panels));
    marks.push(inkLine(`panels-${name}-hem`, x0, bottom, x1, bottom));
  }
  return marks;
}

function drapes(plan: CoveredCurtain, o: PaneRect): Mark[] {
  const top = o.top;
  const bottom = o.bottom - HEM_CLEARANCE;
  const reach = plan.coverage * (o.right - o.left);
  const span = Math.min(reach * plan.widthJitter, reach);
  const x0 = plan.drapeSide === 'left' ? o.left : o.right - span;
  const x1 = x0 + span;
  return [
    clothFill('fabric', x0, top, x1, bottom),
    ...foldBands('drapes', x0, x1, top, bottom, FOLD_BANDS.drapes),
    inkLine('drapes-edge', x1, top, x1, bottom),
    inkLine('drapes-hem', x0, bottom, x1, bottom),
  ];
}

function venetian(plan: CoveredCurtain, o: PaneRect): Mark[] {
  const top = hangTop(plan, o);
  const bottom = coveredBottom(plan, o);
  const drop = bottom - top;
  const marks: Mark[] = [
    inkLine('venetian-rail', o.left, top, o.right, top),
  ];
  const count = Math.max(1, Math.floor(drop / SLAT_MIN_PITCH));
  const rowH = drop / count;
  // Each row is one slat, hard to the jambs: opaque down its rolled share,
  // transparent below — the lighter the roll, the more glass shows through
  // the gaps. The 0 roll is the closed blind: the rows join into one
  // opaque face.
  const opaqueShare = plan.slatShare > 0 ? plan.slatShare : 1;
  for (let i = 0; i < count; i++) {
    const y = top + i * rowH;
    const slatY = y + rowH * opaqueShare;
    marks.push(clothFill('blind', o.left, y, o.right, slatY));
    marks.push(...handLine(`venetian-slat-${i}`, i, o.left, slatY, o.right, slatY));
  }
  return marks;
}

function roman(plan: CoveredCurtain, o: PaneRect): Mark[] {
  const top = hangTop(plan, o);
  const bottom = coveredBottom(plan, o);
  const marks: Mark[] = [
    inkLine('curtain-rod', o.left, top, o.right, top),
    clothFill('shade', o.left, top, o.right, bottom),
  ];
  // The raised shade's folds bunch above the bottom bar: chunky horizontal
  // bands, shaded by the same irregular passes as the hanging cloth.
  const bandH = (bottom - top) * ROMAN_BAND_SHARE;
  for (let i = 0; i < FOLD_BANDS.roman; i++) {
    const y0 = bottom - (i + 1) * bandH;
    for (let pass = 0; pass < bandShade(i); pass++) marks.push(clothFill('shade', o.left, y0, o.right, y0 + bandH));
    marks.push(...handLine(`roman-fold-${i}`, i, o.left, y0, o.right, y0));
  }
  return [...marks, inkLine('roman-bar', o.left, bottom, o.right, bottom)];
}

const DRAWERS = { panels, drapes, venetian, roman } as const;

export function curtainMarks(plan: CurtainPlan, opening: PaneRect): Mark[] {
  if (!plan.present) return [];
  return DRAWERS[plan.kind](plan, opening);
}

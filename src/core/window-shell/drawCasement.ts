// The casement: vertical mullions divide the glass into leaves; the leaf (or
// one leaf of a pair) swings toward the viewer. The leaf keeps its true
// rectangle and narrows by the swing's cosine — the hand-drawn "swung open" —
// while its points stand out of the wall at the swing's depth, so projection
// and parallax place it in front of the wall. Its original panes lose their
// glass; the leaf carries the wash with it.
import { ARCHETYPES, type ShellPlan } from './archetypes';
import type { Mark } from '../scene/mark';
import type { Pt3 } from '../../motion/projection';
import { SHELL_Z, innerRect, line, rectPts } from './shell';

// How far the leaf opens, as its angle off the wall plane, per open state.
const SWING = { open: 0.9, 'half-open': 0.45, closed: 0 } as const;

export function drawCasement(plan: ShellPlan): Mark[] {
  const { layout, open, hingeSide } = plan;
  const { top, bottom, left, right } = innerRect(plan.faceWidth);
  const t = ARCHETYPES.casement.frameThickness * plan.thicknessJitter;
  const barW = t * 0.7;

  const marks: Mark[] = [];

  if (layout !== 'single') {
    marks.push({ kind: 'stroke', pts: line(0, top, 0, bottom), name: 'mullion-v', width: barW, role: 'ink', z: SHELL_Z.frame });
  }
  if (layout === 'four-pane') {
    marks.push({ kind: 'stroke', pts: line(left, 0, right, 0), name: 'bar-h', width: barW, role: 'ink', z: SHELL_Z.frame });
  }

  const wallPanes: Pt3[][] =
    layout === 'single'
      ? [rectPts(left, top, right, bottom)]
      : layout === 'pair'
        ? [rectPts(left, top, 0, bottom), rectPts(0, top, right, bottom)]
        : [
            rectPts(left, top, 0, 0),
            rectPts(0, top, right, 0),
            rectPts(left, 0, 0, bottom),
            rectPts(0, 0, right, bottom),
          ];
  const glass = (pts: Pt3[]) => marks.push({ kind: 'fill', pts, role: 'glass', z: SHELL_Z.glass });

  if (open === 'closed') {
    for (const pane of wallPanes) glass(pane);
    return marks;
  }

  const hingeX = hingeSide === 'left' ? left : right;
  const far = layout === 'single' ? (hingeSide === 'left' ? right : left) : 0;
  // The free edge keeps its rectangle: x foreshortened by the swing's cosine,
  // while depth grows with distance from the hinge — the leaf's plane swings
  // out of the wall at the swing's tangent.
  const freeX = hingeX + (far - hingeX) * Math.cos(SWING[open]);
  const zAt = (x: number) => Math.abs(x - hingeX) * Math.tan(SWING[open]);
  const leafDepth = zAt(freeX);

  // The leaf on the hinge side swings; the rest keeps its glass.
  const onHingeSide = (pane: Pt3[]) =>
    hingeSide === 'left' ? pane[0].x === left : pane[1].x === right;
  for (const pane of wallPanes) {
    if (!onHingeSide(pane)) glass(pane);
  }

  const leaf: Pt3[] = [
    { x: hingeX, y: top, z: 0 },
    { x: freeX, y: top, z: leafDepth },
    { x: freeX, y: bottom, z: leafDepth },
    { x: hingeX, y: bottom, z: 0 },
  ];
  marks.push({ kind: 'fill', pts: leaf, role: 'glass', z: SHELL_Z.open });
  marks.push({
    kind: 'stroke',
    pts: [
      { x: hingeX, y: top, z: 0 },
      { x: freeX, y: top, z: leafDepth },
    ],
    name: 'casement-leaf-top',
    width: barW,
    role: 'ink',
    z: SHELL_Z.open,
  });
  marks.push({
    kind: 'stroke',
    pts: [
      { x: hingeX, y: bottom, z: 0 },
      { x: freeX, y: bottom, z: leafDepth },
    ],
    name: 'casement-leaf-bottom',
    width: barW,
    role: 'ink',
    z: SHELL_Z.open,
  });
  marks.push({
    kind: 'stroke',
    pts: [
      { x: freeX, y: top, z: leafDepth },
      { x: freeX, y: bottom, z: leafDepth },
    ],
    name: 'casement-leaf-free',
    width: barW,
    role: 'ink',
    z: SHELL_Z.open,
  });
  return marks;
}

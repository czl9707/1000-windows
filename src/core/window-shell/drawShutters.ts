// The shutters: two panels hung at the opening's outer edges, swung half
// open toward the viewer — out from the wall, covering no part of the glass.
// They mount on sliding windows only: expandShell never rolls them onto a
// swung casement. Each panel is half the opening's width for real (shut, the
// pair would meet over the glass); drawn it narrows by the swing's cosine —
// the same verdict as the open casement leaf — while its points stand out of
// the wall at the swing's depth. The panel fills opaque: swung out, it hides
// the wall behind it.
import type { ShellPlan } from './archetypes';
import type { Mark } from '@/core/scene';
import { WEIGHTS } from '@/styling/weights';
import { SHELL_Z, innerRect, paneEdges, rectPts, swingDepthAt, type PaneRect } from './shell';

// Half-open, as the panel's angle off the wall plane. Fixed, never rolled:
// the angle is what the drawing says, not a fact about the window.
const SWING = 1.05;
const SLATS = 6;
const INSET = 0.045;

const SLAT_MARGIN = 0.02;

interface Span {
  x0: number;
  x1: number;
  zAt: (x: number) => number;
}

function panelSpan(hingeX: number, outerX: number): Span {
  return {
    x0: Math.min(hingeX, outerX),
    x1: Math.max(hingeX, outerX),
    zAt: swingDepthAt(hingeX, SWING),
  };
}

function panelMarks(side: 'l' | 'r', span: Span, top: number, bottom: number): Mark[] {
  const { x0, x1, zAt } = span;
  const rect: PaneRect = { top, bottom, left: x0, right: x1 };
  return [
    { kind: 'fill', pts: rectPts(x0, top, x1, bottom, zAt), role: 'shutter', z: SHELL_Z.shutter },
    ...paneEdges(rect, `shutter-${side}`, SHELL_Z.shutter, WEIGHTS.structural, { depthAt: zAt }),
  ];
}

function shutterSides(face: number): { side: 'l' | 'r'; span: Span }[] {
  const { left, right } = innerRect(face);
  // True panel width: half the opening, so shut panels would meet over the
  // glass. Swung, the wall span foreshortens by the cosine.
  const trueWidth = (right - left) / 2;
  const drawn = trueWidth * Math.cos(SWING);
  return [
    { side: 'l', span: panelSpan(left, left - drawn) },
    { side: 'r', span: panelSpan(right, right + drawn) },
  ];
}

function louvered(face: number): Mark[] {
  const { top, bottom } = innerRect(face);
  const marks: Mark[] = [];
  for (const { side, span } of shutterSides(face)) {
    marks.push(...panelMarks(side, span, top, bottom));
    const { x0, x1, zAt } = span;
    for (let i = 1; i <= SLATS; i++) {
      const y = top + ((bottom - top) * i) / (SLATS + 1);
      marks.push({
        kind: 'stroke',
        pts: [
          { x: x0 + SLAT_MARGIN, y, z: zAt(x0 + SLAT_MARGIN) },
          { x: x1 - SLAT_MARGIN, y, z: zAt(x1 - SLAT_MARGIN) },
        ],
        name: `shutter-${side}-slat-${i}`,
        widthUnits: WEIGHTS.hairline,
        role: 'ink',
        z: SHELL_Z.shutter,
      });
    }
  }
  return marks;
}

function paneled(face: number): Mark[] {
  const { top, bottom } = innerRect(face);
  const marks: Mark[] = [];
  for (const { side, span } of shutterSides(face)) {
    marks.push(...panelMarks(side, span, top, bottom));
    const { x0, x1, zAt } = span;
    const inset: PaneRect = {
      top: top + INSET,
      bottom: bottom - INSET,
      left: x0 + INSET,
      right: x1 - INSET,
    };
    marks.push(...paneEdges(inset, `shutter-${side}-panel`, SHELL_Z.shutter, WEIGHTS.hairline, { depthAt: zAt }));
  }
  return marks;
}

export function drawShutters(plan: ShellPlan): Mark[] {
  if (plan.shutters === 'none') return [];
  return plan.shutters === 'louvered' ? louvered(plan.faceWidth) : paneled(plan.faceWidth);
}

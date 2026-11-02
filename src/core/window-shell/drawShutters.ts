// The shutters: two panels hung at the opening's outer edges, swung half
// open toward the viewer — out from the wall, covering no part of the glass.
// Each panel is half the opening's width for real (shut, the pair would meet
// over the glass); drawn it narrows by the swing's cosine, the same verdict
// as the open casement leaf, while its points stand out of the wall at the
// swing's depth. The panel fills opaque: swung out, it hides the wall behind
// it.
import type { ShellPlan } from './archetypes';
import type { Mark } from '@/core/scene/mark';
import type { Pt3 } from '@/motion/projection';
import { SHELL_Z, innerRect } from './shell';

// Half-open, as the panel's angle off the wall plane. Fixed, never rolled:
// the angle is what the drawing says, not a fact about the window.
const SWING = 1.05;
const SLATS = 6;
const INSET = 0.045;

// Depth grows with distance from the hinge: the panel's plane swings out of
// the wall at the swing's tangent.
const swingZ = (hingeX: number) => (x: number) => Math.abs(x - hingeX) * Math.tan(SWING);

function panelMarks(
  side: 'l' | 'r',
  hingeX: number,
  outerX: number,
  top: number,
  bottom: number,
): Mark[] {
  const z = SHELL_Z.addon;
  const w = 0.026;
  const zAt = swingZ(hingeX);
  const P = (x: number, y: number): Pt3 => ({ x, y, z: zAt(x) });
  const x0 = Math.min(hingeX, outerX);
  const x1 = Math.max(hingeX, outerX);
  return [
    {
      kind: 'fill',
      pts: [P(x0, top), P(x1, top), P(x1, bottom), P(x0, bottom)],
      role: 'paper',
      z,
    },
    { kind: 'stroke', pts: [P(x0, top), P(x1, top)], name: `shutter-${side}-top`, width: w, role: 'ink', z },
    { kind: 'stroke', pts: [P(x0, bottom), P(x1, bottom)], name: `shutter-${side}-bottom`, width: w, role: 'ink', z },
    { kind: 'stroke', pts: [P(outerX, top), P(outerX, bottom)], name: `shutter-${side}-outer`, width: w, role: 'ink', z },
    { kind: 'stroke', pts: [P(hingeX, top), P(hingeX, bottom)], name: `shutter-${side}-hinge`, width: w, role: 'ink', z },
  ];
}

// Both shutters as (side, hinge-x, outer-x) spans beside the opening.
function shutterSides(face: number): { side: 'l' | 'r'; hingeX: number; outerX: number }[] {
  const { left, right } = innerRect(face);
  // True panel width: half the opening, so shut panels would meet over the
  // glass. Swung, the wall span foreshortens by the cosine.
  const trueWidth = (right - left) / 2;
  const drawn = trueWidth * Math.cos(SWING);
  return [
    { side: 'l', hingeX: left, outerX: left - drawn },
    { side: 'r', hingeX: right, outerX: right + drawn },
  ];
}

function louvered(face: number): Mark[] {
  const { top, bottom } = innerRect(face);
  const marks: Mark[] = [];
  for (const { side, hingeX, outerX } of shutterSides(face)) {
    marks.push(...panelMarks(side, hingeX, outerX, top, bottom));
    const zAt = swingZ(hingeX);
    const x0 = Math.min(hingeX, outerX);
    const x1 = Math.max(hingeX, outerX);
    for (let i = 1; i <= SLATS; i++) {
      const y = top + ((bottom - top) * i) / (SLATS + 1);
      marks.push({
        kind: 'stroke',
        pts: [
          { x: x0 + 0.02, y, z: zAt(x0 + 0.02) },
          { x: x1 - 0.02, y, z: zAt(x1 - 0.02) },
        ],
        name: `shutter-${side}-slat-${i}`,
        width: 0.02,
        role: 'ink',
        z: SHELL_Z.addon,
      });
    }
  }
  return marks;
}

function paneled(face: number): Mark[] {
  const { top, bottom } = innerRect(face);
  const marks: Mark[] = [];
  for (const { side, hingeX, outerX } of shutterSides(face)) {
    marks.push(...panelMarks(side, hingeX, outerX, top, bottom));
    const zAt = swingZ(hingeX);
    const x0 = Math.min(hingeX, outerX) + INSET;
    const x1 = Math.max(hingeX, outerX) - INSET;
    const py0 = top + INSET;
    const py1 = bottom - INSET;
    marks.push(
      { kind: 'stroke', pts: [{ x: x0, y: py0, z: zAt(x0) }, { x: x1, y: py0, z: zAt(x1) }], name: `shutter-${side}-panel-top`, width: 0.022, role: 'ink', z: SHELL_Z.addon },
      { kind: 'stroke', pts: [{ x: x0, y: py1, z: zAt(x0) }, { x: x1, y: py1, z: zAt(x1) }], name: `shutter-${side}-panel-bottom`, width: 0.022, role: 'ink', z: SHELL_Z.addon },
      { kind: 'stroke', pts: [{ x: x0, y: py0, z: zAt(x0) }, { x: x0, y: py1, z: zAt(x0) }], name: `shutter-${side}-panel-l`, width: 0.022, role: 'ink', z: SHELL_Z.addon },
      { kind: 'stroke', pts: [{ x: x1, y: py0, z: zAt(x1) }, { x: x1, y: py1, z: zAt(x1) }], name: `shutter-${side}-panel-r`, width: 0.022, role: 'ink', z: SHELL_Z.addon },
    );
  }
  return marks;
}

export function drawShutters(plan: ShellPlan): Mark[] {
  if (plan.shutters === 'none') return [];
  return plan.shutters === 'louvered' ? louvered(plan.faceWidth) : paneled(plan.faceWidth);
}
